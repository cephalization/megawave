import * as fs from "fs/promises";
import * as path from "path";
import { z } from "zod";

import type { makeDb } from "db";

import { AudioTrack, hasAudioFileExtension } from "./audio.js";
import type { PaginationMeta, Track } from "./schemas.js";

export const audioLibraryStatusSchema = z.enum(["loading", "idle", "error"]);
export type AudioLibraryStatus = z.infer<typeof audioLibraryStatusSchema>;

/**
 * Tracks the status of a library scan operation
 *
 * This provides clients with detailed information about the progress
 * of an ongoing library load operation, enabling UI feedback.
 */
export interface LoadProgress {
  totalPaths: number; // Total directories being scanned
  currentPathIndex: number; // Current directory index being processed
  currentPath: string; // Path currently being scanned
  filesDiscovered: number; // Total audio files found so far
  filesProcessed: number; // Number of files that have been processed
  trackCount: number; // Number of valid tracks added to the library
  percentage: number; // Overall completion percentage (0-100)
  error?: string; // Error message if scan failed
}

/**
 * Music library manager that handles discovery and indexing of audio files
 *
 * The Library class provides methods to scan directories for audio files,
 * process their metadata, and query the indexed tracks with filtering and sorting.
 * It supports asynchronous loading with progress tracking and graceful cancellation.
 */
export class Library {
  public status: AudioLibraryStatus;
  private tracks: Map<string, AudioTrack>; // Map of track ID to AudioTrack objects
  private trackIds: string[]; // Ordered list of track IDs for consistent retrieval
  private _currentLoadPromise: Promise<void> | null;
  private _cancelRequested: boolean;
  private _loadProgress: LoadProgress | null;

  constructor(private db: ReturnType<typeof makeDb>) {
    this.status = "idle";
    this.tracks = new Map();
    this.trackIds = [];
    this._currentLoadPromise = null;
    this._cancelRequested = false;
    this._loadProgress = null;
  }

  /**
   * Clears the library and resets all internal state
   *
   * This will cancel any ongoing load operation and remove all tracks.
   */
  public reset(): void {
    this.tracks.clear();
    this.trackIds = [];
    this.status = "idle";
    this._cancelRequested = true;
    this._currentLoadPromise = null;
    this._loadProgress = null;
  }

  /**
   * Retrieves a track by its unique ID
   *
   * @param id - Unique identifier for the track
   * @returns The AudioTrack if found and valid, undefined otherwise
   */
  public getById(id: string): AudioTrack | undefined {
    const track = this.tracks.get(id);
    return track && track.ok ? track : undefined;
  }

  /**
   * Adds a track to the library if it's valid and not already present
   *
   * @param audioTrack - The track to add to the library
   */
  private append(audioTrack: AudioTrack): void {
    if (audioTrack.ok && !this.tracks.has(audioTrack.id)) {
      this.tracks.set(audioTrack.id, audioTrack);
      this.trackIds.push(audioTrack.id);
    }
  }

  /**
   * Retrieves the current progress of an ongoing library load operation
   *
   * @returns LoadProgress object or null if no load is in progress
   */
  public getLoadProgress(): LoadProgress | null {
    return this._loadProgress;
  }

  /**
   * Queries the library with optional filtering, sorting, and pagination
   *
   * @param options - Query parameters including filters, sorting, and pagination
   * @returns Paginated track data with metadata
   */
  public getEntries({
    limit,
    offset,
    filter,
    sort,
    subkeyfilter,
  }: {
    limit?: number;
    offset?: number;
    filter?: string;
    sort?: string;
    subkeyfilter?: string;
  }): {
    data: Track[];
    meta: PaginationMeta;
  } {
    // Get all valid tracks as serialized Track objects
    let allTracks = this.trackIds
      .map((id) => this.tracks.get(id)?.serialize())
      .filter((track) => track) as Track[];

    // Apply text-based filtering across artist/name/album fields
    if (filter) {
      const sanitizedFilterQuery = filter.toLowerCase();
      const groupedByMatchingKey: {
        artist: Track[];
        name: Track[];
        album: Track[];
      } = {
        artist: [],
        name: [],
        album: [],
      };

      for (const track of allTracks) {
        const { match, key } = AudioTrack.matchesFilter(
          track,
          sanitizedFilterQuery
        );
        if (match && key) {
          if (key === "artist") groupedByMatchingKey.artist.push(track);
          else if (key === "name") groupedByMatchingKey.name.push(track);
          else if (key === "album") groupedByMatchingKey.album.push(track);
        }
      }
      // Combine results with priority: artist > name > album
      allTracks = [
        ...groupedByMatchingKey.artist,
        ...groupedByMatchingKey.name,
        ...groupedByMatchingKey.album,
      ];
    }

    // Apply field-specific filtering with format: field-value (e.g., artist-beatles)
    if (subkeyfilter) {
      const parts = subkeyfilter.split("-");
      if (parts.length >= 2) {
        const field = parts[0].toLocaleLowerCase();
        const term = parts.slice(1).join("-").toLocaleLowerCase();

        if (field === "artist" || field === "album" || field === "name") {
          allTracks = allTracks.filter((track) => {
            const trackValue = track[field as keyof Track];
            if (Array.isArray(trackValue)) {
              return trackValue.some((val) =>
                val.toLocaleLowerCase().includes(term)
              );
            } else if (typeof trackValue === "string") {
              return trackValue.toLocaleLowerCase().includes(term);
            }
            return false;
          });
        }
      }
    }

    // Helper for track number sorting
    const getTrackNo = (track: Track): number => track.track?.no ?? Infinity;

    // Apply sorting if specified, or use default sort
    if (sort) {
      const reverse = sort.startsWith("-");
      const sortKeyString = (reverse ? sort.substring(1) : sort).toLowerCase();

      if (
        sortKeyString === "name" ||
        sortKeyString === "artist" ||
        sortKeyString === "album"
      ) {
        const sortKey = sortKeyString as "name" | "artist" | "album";
        allTracks.sort((a, b) => {
          let valA_primary = AudioTrack.getAudioFileSortValue(a, sortKey);
          let valB_primary = AudioTrack.getAudioFileSortValue(b, sortKey);

          if (reverse) {
            if (valA_primary === "zzzzz") valA_primary = "";
            if (valB_primary === "zzzzz") valB_primary = "";
          }

          let comparison = 0;
          if (valA_primary < valB_primary) {
            comparison = -1;
          } else if (valA_primary > valB_primary) {
            comparison = 1;
          }

          // Secondary sort by track number for equal primary values
          if (comparison === 0) {
            const trackNoA = getTrackNo(a);
            const trackNoB = getTrackNo(b);

            if (sortKey === "album") {
              const subkeyFilterIsAlbum = subkeyfilter
                ?.toLocaleLowerCase()
                .startsWith("album-");
              const shouldReverseTracks = reverse && subkeyFilterIsAlbum;

              if (shouldReverseTracks) {
                comparison = trackNoB - trackNoA;
              } else {
                comparison = trackNoA - trackNoB;
              }
            } else {
              comparison = trackNoA - trackNoB;
            }
          }
          return reverse ? comparison * -1 : comparison;
        });
      }
    } else {
      // Default sort: album name (asc), then track number (asc)
      allTracks.sort((a, b) => {
        const albumA = AudioTrack.getAudioFileSortValue(a, "album");
        const albumB = AudioTrack.getAudioFileSortValue(b, "album");

        let comparison = 0;
        if (albumA < albumB) {
          comparison = -1;
        } else if (albumA > albumB) {
          comparison = 1;
        }

        if (comparison === 0) {
          comparison = getTrackNo(a) - getTrackNo(b);
        }
        return comparison;
      });
    }

    // Apply pagination to results
    const totalFilteredTracks = allTracks.length;
    const actualOffset = offset ?? 0;
    const actualLimit = limit ?? totalFilteredTracks;

    const paginatedTracks = allTracks.slice(
      actualOffset,
      actualOffset + actualLimit
    );

    return {
      data: paginatedTracks,
      meta: {
        total: totalFilteredTracks,
        limit: actualLimit,
        offset: actualOffset,
        next: null,
        previous: null,
      },
    };
  }

  /**
   * Serializes the entire library to an array of Track objects
   *
   * @returns Array of serialized track objects
   */
  public serialize(): Track[] {
    const output: Track[] = [];
    for (const trackId of this.trackIds) {
      const track = this.tracks.get(trackId);
      if (track && track.ok) {
        const serializedTrack = track.serialize();
        if (serializedTrack) {
          output.push(serializedTrack);
        }
      }
    }
    return output;
  }

  /**
   * Requests cancellation of an ongoing library load operation
   *
   * The load will complete gracefully at the next cancellation check point.
   */
  public cancelLoad(): void {
    if (this.status === "loading") {
      this._cancelRequested = true;
      console.log("Library load cancellation requested");
    }
  }

  /**
   * Finds all audio files in a directory and its subdirectories
   *
   * Uses a non-recursive approach with a queue to avoid stack overflow
   * with deep directory structures. Regularly yields to the main thread
   * to avoid blocking the event loop.
   *
   * @param dirPath - Root directory to scan for audio files
   * @returns Promise resolving to a list of audio file paths
   */
  private async findAudioFiles(dirPath: string): Promise<string[]> {
    const audioFiles: string[] = [];

    // Use a queue-based approach instead of recursion
    const queue: string[] = [dirPath];
    let processedFiles = 0;

    while (queue.length > 0 && !this._cancelRequested) {
      const currentDir = queue.shift()!;

      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          if (this._cancelRequested) break;

          const fullPath = path.resolve(currentDir, entry.name);

          if (entry.isDirectory()) {
            queue.push(fullPath);
          } else {
            const { hasExt } = hasAudioFileExtension(entry.name);
            if (hasExt) {
              audioFiles.push(fullPath);
            }
            processedFiles++;

            if (this._loadProgress) {
              this._loadProgress.filesDiscovered = processedFiles;
            }

            // Yield to main thread periodically to avoid blocking
            if (processedFiles % 100 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          }
        }
      } catch (err) {
        console.error(`Error scanning directory ${currentDir}:`, err);
      }
    }

    return audioFiles;
  }

  /**
   * Processes a list of audio files in batches
   *
   * This divides the work into manageable chunks and updates progress
   * as each batch completes. Yields to the main thread between batches
   * to avoid blocking the event loop.
   *
   * @param files - List of audio file paths to process
   * @param batchSize - Number of files to process in each batch
   * @returns Promise with statistics about processed files
   */
  private async processFiles(
    files: string[],
    batchSize: number = 50
  ): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;
    let processed = 0;

    for (let i = 0; i < files.length; i += batchSize) {
      if (this._cancelRequested) break;

      const batch = files.slice(i, i + batchSize);
      const batchResults = await this.processBatch(batch);

      added += batchResults.added;
      skipped += batchResults.skipped;
      processed += batch.length;

      // Update progress tracking for UI feedback
      if (this._loadProgress) {
        this._loadProgress.filesProcessed = processed;
        this._loadProgress.trackCount = this.tracks.size;
        this._loadProgress.percentage = Math.floor(
          (processed / files.length) * 100
        );
      }

      // Yield to main thread between batches
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return { added, skipped };
  }

  /**
   * Processes a batch of audio files by reading their metadata
   *
   * @param filesToProcess - Batch of file paths to process
   * @returns Promise with counts of added and skipped files
   */
  private async processBatch(
    filesToProcess: string[]
  ): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    for (const filePath of filesToProcess) {
      if (this._cancelRequested) break;

      const audioTrack = new AudioTrack(filePath);
      await audioTrack.initialize();

      if (audioTrack.ok) {
        this.append(audioTrack);
        added++;
      } else {
        skipped++;
      }
    }

    return { added, skipped };
  }

  /**
   * Scans directories for audio files and loads them into the library
   *
   * This is the main entry point for library scanning. It handles:
   * - Cancelling previous scans if needed
   * - Discovering audio files non-recursively
   * - Processing files in batches
   * - Tracking progress for UI feedback
   * - Error handling and recovery
   *
   * @param pathsToScan - Array of directory paths to scan for audio files
   * @returns Promise that resolves when scanning is complete
   */
  public async load(pathsToScan: string[]): Promise<void> {
    // Cancel any ongoing load operation
    if (this.status === "loading" && this._currentLoadPromise) {
      console.log("Cancelling previous library load operation");
      this.cancelLoad();
      try {
        await this._currentLoadPromise;
      } catch (e) {
        console.log("Previous load operation completed or cancelled");
      }
    }

    // Reset state and prepare for new load
    this.reset();
    this._cancelRequested = false;
    this.status = "loading";

    // Initialize progress tracking
    this._loadProgress = {
      totalPaths: pathsToScan.length,
      currentPathIndex: 0,
      currentPath: "",
      filesDiscovered: 0,
      filesProcessed: 0,
      trackCount: 0,
      percentage: 0,
    };

    console.log(`Starting library scan (${pathsToScan.length} paths)`);

    const loadOperation = async () => {
      try {
        // Process each directory path
        for (let i = 0; i < pathsToScan.length; i++) {
          if (this._cancelRequested) break;

          const currentPath = pathsToScan[i];
          console.log(
            `Scanning path ${i + 1}/${pathsToScan.length}: ${currentPath}`
          );

          // Update progress for current path
          if (this._loadProgress) {
            this._loadProgress.currentPathIndex = i;
            this._loadProgress.currentPath = currentPath;
            this._loadProgress.filesProcessed = 0;
            this._loadProgress.percentage = 0;
          }

          // First discover all audio files in the path
          const audioFiles = await this.findAudioFiles(currentPath);

          if (this._cancelRequested) break;

          console.log(
            `Found ${audioFiles.length} audio files in ${currentPath}`
          );

          // Then process them in batches
          const { added, skipped } = await this.processFiles(audioFiles);

          if (this._cancelRequested) {
            console.log(`Load cancelled during processing of ${currentPath}`);
            break;
          }

          console.log(
            `Processed ${currentPath}: Added ${added}, Skipped ${skipped} files`
          );
        }

        if (!this._cancelRequested) {
          console.log(
            `Library load complete: ${this.tracks.size} tracks loaded`
          );
        }
      } catch (error) {
        console.error("Error during library load:", error);
        this.status = "error";

        // Capture error for UI display
        if (this._loadProgress) {
          this._loadProgress.error =
            error instanceof Error ? error.message : String(error);
        }
      } finally {
        // Clean up regardless of success or failure
        if (this.status === "loading" || this._cancelRequested) {
          this.status = "idle";
        }
        this._cancelRequested = false;
        this._currentLoadPromise = null;
      }
    };

    this._currentLoadPromise = loadOperation();
    await this._currentLoadPromise;
  }
}
