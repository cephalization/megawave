import * as fs from "fs/promises";
import * as path from "path";
import { AudioTrack, hasAudioFileExtension } from "./audio.js";
import type { PaginationMeta, Track } from "./schemas.js";
import { z } from "zod";

export const audioLibraryStatusSchema = z.enum(["loading", "idle", "error"]);
export type AudioLibraryStatus = z.infer<typeof audioLibraryStatusSchema>;

export class Library {
  public status: AudioLibraryStatus;
  private tracks: Map<string, AudioTrack>; // Equivalent to libraryDict
  private trackIds: string[]; // Equivalent to library (ordered list of ids)
  private _currentLoadPromise: Promise<void> | null;
  private _cancelRequested: boolean;

  constructor() {
    this.status = "idle";
    this.tracks = new Map();
    this.trackIds = [];
    this._currentLoadPromise = null;
    this._cancelRequested = false;
  }

  public reset(): void {
    this.tracks.clear();
    this.trackIds = [];
    this.status = "idle";
    if (this._currentLoadPromise) {
      // If a load was in progress, ensure cancellation is flagged
      // so it can terminate cleanly if it hasn't already.
      this._cancelRequested = true;
    }
    this._currentLoadPromise = null;
    // _cancelRequested is reset at the beginning of a new load or if explicitly done.
  }

  public getById(id: string): AudioTrack | undefined {
    const track = this.tracks.get(id);
    return track && track.ok ? track : undefined;
  }

  private append(audioTrack: AudioTrack): void {
    // Ensure track is valid and not already in the library before appending
    if (audioTrack.ok && !this.tracks.has(audioTrack.id)) {
      this.tracks.set(audioTrack.id, audioTrack);
      this.trackIds.push(audioTrack.id);
    }
  }

  public getEntries({ limit, offset }: { limit?: number; offset?: number }): {
    data: Track[];
    meta: PaginationMeta;
  } {
    const filteredTracks = this.trackIds
      .slice(offset ?? 0, (offset ?? 0) + (limit ?? this.trackIds.length))
      .map((id) => this.tracks.get(id)?.serialize())
      .filter((track) => track) as Track[]; // Filter out undefined or !ok tracks

    return {
      data: filteredTracks,
      meta: {
        total: this.trackIds.length,
        limit: limit ?? this.trackIds.length,
        offset: offset ?? 0,
        next: null,
        previous: null,
      },
    };
  }

  public serialize(): Track[] {
    const output: Track[] = [];
    for (const trackId of this.trackIds) {
      const track = this.tracks.get(trackId);
      if (track && track.ok) {
        const serializedTrack = track.serialize(); // Renamed to avoid conflict with TrackSerialized type
        if (serializedTrack) {
          output.push(serializedTrack);
        }
      }
    }
    return output;
  }

  public cancelLoad(): void {
    if (this.status === "loading") {
      this._cancelRequested = true;
      console.log("Library load cancellation requested.");
    }
  }

  /**
   * Generator that recursively walks directories and yields file paths
   */
  private async *_walkFiles(
    dir: string
  ): AsyncGenerator<string, void, unknown> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (this._cancelRequested) return;

        const fullPath = path.resolve(dir, entry.name);
        if (entry.isDirectory()) {
          yield* this._walkFiles(fullPath);
        } else {
          yield fullPath;
        }
      }
    } catch (err) {
      console.error(`Error walking directory ${dir}:`, err);
    }
  }

  /**
   * Generator that yields batches of file paths
   */
  private async *_getBatches(
    files: string[],
    batchSize: number
  ): AsyncGenerator<string[], void, unknown> {
    for (let i = 0; i < files.length; i += batchSize) {
      if (this._cancelRequested) return;
      yield files.slice(i, i + batchSize);
    }
  }

  /**
   * Process a batch of files and return stats
   */
  private async _processFileBatch(
    filesToProcess: string[]
  ): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    for (const filePath of filesToProcess) {
      if (this._cancelRequested) break;

      const audioTrack = new AudioTrack(filePath); // Constructor handles initial fileType check
      await audioTrack.initialize(); // Reads tags, sets ok status

      if (audioTrack.ok) {
        this.append(audioTrack);
        added++;
      } else {
        // AudioTrack constructor or initialize decided it's not a valid/readable audio file
        skipped++;
      }
    }
    return { added, skipped };
  }

  public async load(pathsToScan: string[]): Promise<void> {
    if (this.status === "loading" && this._currentLoadPromise) {
      console.warn(
        "Load already in progress. Requesting cancellation of previous load."
      );
      this.cancelLoad(); // Request cancellation
      try {
        await this._currentLoadPromise; // Wait for the ongoing load to acknowledge cancellation and finish
      } catch (e) {
        console.log(
          "Previous load operation completed or was already cancelled."
        );
      }
    }

    this.reset(); // Clear existing library data and reset status
    this._cancelRequested = false; // Ensure cancellation flag is reset for the new load
    this.status = "loading";
    console.log("Starting library load...");

    const loadOperation = async () => {
      let overallTotalAdded = 0;
      let overallTotalSkipped = 0;
      const BATCH_SIZE = 50; // Process files in batches

      try {
        for (const p of pathsToScan) {
          if (this._cancelRequested) break;

          let addedThisPath = 0;
          let skippedThisPath = 0;

          console.log(`- - - Scanning music library at "${p}" - - - `);

          // Collect all audio files from the directory walk
          const audioFilePaths: string[] = [];
          for await (const filePath of this._walkFiles(p)) {
            if (this._cancelRequested) break;
            const { hasExt } = hasAudioFileExtension(path.basename(filePath));
            if (hasExt) {
              audioFilePaths.push(filePath);
            }
          }

          console.log(
            `Found ${audioFilePaths.length} potential audio files in ${p}`
          );

          // Process files in batches using generator
          for await (const batch of this._getBatches(
            audioFilePaths,
            BATCH_SIZE
          )) {
            if (this._cancelRequested) break;

            const { added, skipped } = await this._processFileBatch(batch);
            addedThisPath += added;
            skippedThisPath += skipped;
            overallTotalAdded += added;
            overallTotalSkipped += skipped;
          }

          if (this._cancelRequested) {
            console.log(`Load cancelled while processing path: ${p}`);
            break;
          }
          console.log(
            `- - - - Finished processing ${p}: Added ${addedThisPath} songs, Skipped ${skippedThisPath} files (from this path) - - - -`
          );
        }

        if (this._cancelRequested) {
          console.log("Library load was cancelled by request.");
        } else {
          console.log(
            `- - - Loaded ${this.tracks.size} songs total (Overall added this session: ${overallTotalAdded}) - - - `
          );
          console.log(
            `- - - Skipped ${overallTotalSkipped} files total this session (invalid/unreadable) - - -`
          );
          console.log("- - - Done loading music library - - - ");
        }
      } catch (error) {
        console.error("Error during library load operation:", error);
        this.status = "error";
      } finally {
        // Set status to idle if it was loading and not error, or if cancelled.
        if (this.status === "loading" || this._cancelRequested) {
          this.status = "idle";
        }
        this._cancelRequested = false; // Reset cancellation flag
        this._currentLoadPromise = null; // Clear the promise for the completed/cancelled operation
      }
    };

    this._currentLoadPromise = loadOperation();
    await this._currentLoadPromise;
  }
}
