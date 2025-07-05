import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

import type { DB, makeDb } from 'db';
import { eq, and, or, like, desc, asc, sql, count } from 'db/drizzle';
import {
  tracks,
  artists,
  albums,
  genres,
  scanSessions,
  trackScans,
  trackArtists,
} from 'db/schema';

import { AudioTrack, hasAudioFileExtension } from './audio.js';
import type { PaginationMeta, Track } from './schemas.js';

export const audioLibraryStatusSchema = z.enum(['loading', 'idle', 'error']);
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
  private _currentLoadPromise: Promise<void> | null;
  private _cancelRequested: boolean;
  private _loadProgress: LoadProgress | null;
  private _db: DB;
  private _currentScanSessionId: number | null;

  constructor(db: DB) {
    this.status = 'idle';
    this._currentLoadPromise = null;
    this._cancelRequested = false;
    this._loadProgress = null;
    this._db = db;
    this._currentScanSessionId = null;
  }

  /**
   * Resets the library state and cancels any ongoing operations
   */
  public reset(): void {
    this.status = 'idle';
    this._cancelRequested = true;
    this._currentLoadPromise = null;
    this._loadProgress = null;
    this._currentScanSessionId = null;
  }

  /**
   * Retrieves a track by its unique ID
   *
   * @param id - Unique identifier for the track
   * @returns The AudioTrack if found and valid, undefined otherwise
   */
  public async getById(id: string): Promise<AudioTrack | undefined> {
    try {
      const trackId = parseInt(id, 10);
      if (isNaN(trackId)) return undefined;

      const track = await AudioTrack.loadById(trackId, this._db);
      return track || undefined;
    } catch (error) {
      console.error(`Error loading track by ID ${id}:`, error);
      return undefined;
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
  public async getEntries({
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
  }): Promise<{
    data: Track[];
    meta: PaginationMeta;
  }> {
    try {
      let query = this._db.select().from(tracks).$dynamic();
      const conditions = [];

      // Apply text-based filtering across artist/name/album fields
      if (filter) {
        const sanitizedFilter = `%${filter.toLowerCase()}%`;
        conditions.push(
          or(
            like(sql`lower(${tracks.title})`, sanitizedFilter),
            like(sql`lower(${tracks.primaryArtistName})`, sanitizedFilter),
            like(sql`lower(${tracks.albumTitle})`, sanitizedFilter),
          ),
        );
      }

      // Apply field-specific filtering with format: field-value (e.g., artist-beatles)
      if (subkeyfilter) {
        const parts = subkeyfilter.split('-');
        if (parts.length >= 2) {
          const field = parts[0].toLowerCase();
          const term = `%${parts.slice(1).join('-').toLowerCase()}%`;

          if (field === 'artist') {
            conditions.push(
              like(sql`lower(${tracks.primaryArtistName})`, term),
            );
          } else if (field === 'album') {
            conditions.push(like(sql`lower(${tracks.albumTitle})`, term));
          } else if (field === 'name') {
            conditions.push(like(sql`lower(${tracks.title})`, term));
          }
        }
      }

      // Apply conditions
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      if (sort) {
        const reverse = sort.startsWith('-');
        const sortKey = (reverse ? sort.substring(1) : sort).toLowerCase();

        if (sortKey === 'name') {
          query = query.orderBy(
            reverse ? desc(tracks.title) : asc(tracks.title),
          );
        } else if (sortKey === 'artist') {
          query = query.orderBy(
            reverse
              ? desc(tracks.primaryArtistName)
              : asc(tracks.primaryArtistName),
          );
        } else if (sortKey === 'album') {
          query = query.orderBy(
            reverse ? desc(tracks.albumTitle) : asc(tracks.albumTitle),
            asc(tracks.trackNumber),
          );
        }
      } else {
        // Default sort: album name (asc), then track number (asc)
        query = query.orderBy(asc(tracks.albumTitle), asc(tracks.trackNumber));
      }

      // Get total count for pagination
      let totalQuery = this._db
        .select({ count: count() })
        .from(tracks)
        .$dynamic();
      if (conditions.length > 0) {
        totalQuery = totalQuery.where(and(...conditions));
      }
      const totalResult = await totalQuery;
      const total = totalResult[0].count;

      // Apply pagination
      const actualOffset = offset ?? 0;
      const actualLimit = limit ?? total;
      query = query.limit(actualLimit).offset(actualOffset);

      const results = await query;

      // Convert to Track objects
      const trackData: Track[] = results.map((row: any) => ({
        id: row.id.toString(),
        name: row.title,
        album: row.albumTitle ? [row.albumTitle] : null,
        artist: row.primaryArtistName ? [row.primaryArtistName] : null,
        art: null, // Art cache would need to be implemented
        length: row.duration ? row.duration.toString() : '',
        link: `/api/library/songs/${row.id}`,
        fileType: path.extname(row.fileName).slice(1),
        track: row.trackNumber
          ? {
              no: row.trackNumber,
              total: row.totalTracks || undefined,
            }
          : undefined,
      }));

      return {
        data: trackData,
        meta: {
          total,
          limit: actualLimit,
          offset: actualOffset,
          next: null,
          previous: null,
        },
      };
    } catch (error) {
      console.error('Error querying tracks:', error);
      return {
        data: [],
        meta: {
          total: 0,
          limit: limit ?? 50,
          offset: offset ?? 0,
          next: null,
          previous: null,
        },
      };
    }
  }

  /**
   * Serializes the entire library to an array of Track objects
   *
   * @returns Array of serialized track objects
   */
  public async serialize(): Promise<Track[]> {
    const result = await this.getEntries({});
    return result.data;
  }

  /**
   * Requests cancellation of an ongoing library load operation
   */
  public cancelLoad(): void {
    if (this.status === 'loading') {
      this._cancelRequested = true;
      console.log('Library load cancellation requested');
    }
  }

  /**
   * Creates a new scan session
   */
  private async createScanSession(pathsToScan: string[]): Promise<number> {
    const result = await this._db
      .insert(scanSessions)
      .values({
        startTime: Date.now(),
        pathsScanned: JSON.stringify(pathsToScan),
        tracksFound: 0,
        tracksAdded: 0,
        tracksUpdated: 0,
        status: 'running',
      })
      .returning({ id: scanSessions.id });

    return result[0].id;
  }

  /**
   * Updates a scan session with final results
   */
  private async completeScanSession(
    sessionId: number,
    stats: { found: number; added: number; updated: number },
    status: 'completed' | 'failed' | 'cancelled' = 'completed',
  ): Promise<void> {
    await this._db
      .update(scanSessions)
      .set({
        endTime: Date.now(),
        tracksFound: stats.found,
        tracksAdded: stats.added,
        tracksUpdated: stats.updated,
        status,
      })
      .where(eq(scanSessions.id, sessionId));
  }

  /**
   * Records that a track was seen during a scan session
   */
  private async recordTrackScan(
    trackId: number,
    sessionId: number,
    filePath: string,
  ): Promise<void> {
    await this._db.insert(trackScans).values({
      trackId,
      scanSessionId: sessionId,
      filePath,
    });
  }

  /**
   * Removes tracks that weren't seen in the latest scan (orphan cleanup)
   */
  private async cleanupOrphanTracks(sessionId: number): Promise<number> {
    try {
      // Find tracks that weren't recorded in this scan session
      const orphanTracks = await this._db
        .select({ id: tracks.id })
        .from(tracks)
        .where(
          sql`${tracks.id} NOT IN (
            SELECT ${trackScans.trackId} 
            FROM ${trackScans} 
            WHERE ${trackScans.scanSessionId} = ${sessionId}
          )`,
        );

      if (orphanTracks.length > 0) {
        const orphanIds = orphanTracks.map((t: any) => t.id);

        // Delete orphaned tracks (cascade will handle relationships)
        await this._db
          .delete(tracks)
          .where(sql`${tracks.id} IN (${orphanIds.join(',')})`);

        console.log(`Cleaned up ${orphanTracks.length} orphaned tracks`);
        return orphanTracks.length;
      }

      return 0;
    } catch (error) {
      console.error('Error cleaning up orphan tracks:', error);
      return 0;
    }
  }

  /**
   * Finds all audio files in a directory and its subdirectories
   */
  private async findAudioFiles(dirPath: string): Promise<string[]> {
    const audioFiles: string[] = [];
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

            // Yield to main thread periodically
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
   */
  private async processFiles(
    files: string[],
    batchSize: number = 50,
  ): Promise<{ added: number; updated: number; skipped: number }> {
    let added = 0;
    let updated = 0;
    let skipped = 0;
    let processed = 0;

    for (let i = 0; i < files.length; i += batchSize) {
      if (this._cancelRequested) break;

      const batch = files.slice(i, i + batchSize);
      const batchResults = await this.processBatch(batch);

      added += batchResults.added;
      updated += batchResults.updated;
      skipped += batchResults.skipped;
      processed += batch.length;

      // Update progress tracking
      if (this._loadProgress) {
        this._loadProgress.filesProcessed = processed;
        this._loadProgress.trackCount = added + updated;
        this._loadProgress.percentage = Math.floor(
          (processed / files.length) * 100,
        );
      }

      // Yield to main thread between batches
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return { added, updated, skipped };
  }

  /**
   * Processes a batch of audio files
   */
  private async processBatch(
    filesToProcess: string[],
  ): Promise<{ added: number; updated: number; skipped: number }> {
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const filePath of filesToProcess) {
      if (this._cancelRequested) break;

      try {
        const audioTrack = new AudioTrack(filePath, this._db);
        await audioTrack.initialize();

        if (audioTrack.ok) {
          // Check if track exists
          const existingTrack = await this._db
            .select()
            .from(tracks)
            .where(eq(tracks.contentHash, audioTrack.contentHash!))
            .limit(1);

          await audioTrack.save();

          // Record this track in the current scan session
          if (this._currentScanSessionId && audioTrack.id) {
            await this.recordTrackScan(
              audioTrack.id,
              this._currentScanSessionId,
              filePath,
            );
          }

          if (existingTrack.length > 0) {
            updated++;
          } else {
            added++;
          }
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        skipped++;
      }
    }

    return { added, updated, skipped };
  }

  /**
   * Scans directories for audio files and loads them into the database
   */
  public async load(pathsToScan: string[]): Promise<void> {
    // Cancel any ongoing load operation
    if (this.status === 'loading' && this._currentLoadPromise) {
      console.log('Cancelling previous library load operation');
      this.cancelLoad();
      try {
        await this._currentLoadPromise;
      } catch (e) {
        console.log('Previous load operation completed or cancelled');
      }
    }

    // Reset state and prepare for new load
    this.reset();
    this._cancelRequested = false;
    this.status = 'loading';

    // Initialize progress tracking
    this._loadProgress = {
      totalPaths: pathsToScan.length,
      currentPathIndex: 0,
      currentPath: '',
      filesDiscovered: 0,
      filesProcessed: 0,
      trackCount: 0,
      percentage: 0,
    };

    console.log(`Starting library scan (${pathsToScan.length} paths)`);

    const loadOperation = async () => {
      try {
        // Create scan session
        this._currentScanSessionId = await this.createScanSession(pathsToScan);

        let totalAdded = 0;
        let totalUpdated = 0;
        let totalSkipped = 0;
        let totalFound = 0;

        // Process each directory path
        for (let i = 0; i < pathsToScan.length; i++) {
          if (this._cancelRequested) break;

          const currentPath = pathsToScan[i];
          console.log(
            `Scanning path ${i + 1}/${pathsToScan.length}: ${currentPath}`,
          );

          // Update progress
          if (this._loadProgress) {
            this._loadProgress.currentPathIndex = i;
            this._loadProgress.currentPath = currentPath;
            this._loadProgress.filesProcessed = 0;
            this._loadProgress.percentage = 0;
          }

          // Discover audio files
          const audioFiles = await this.findAudioFiles(currentPath);
          if (this._cancelRequested) break;

          totalFound += audioFiles.length;
          console.log(
            `Found ${audioFiles.length} audio files in ${currentPath}`,
          );

          // Process files
          const { added, updated, skipped } =
            await this.processFiles(audioFiles);
          if (this._cancelRequested) {
            console.log(`Load cancelled during processing of ${currentPath}`);
            break;
          }

          totalAdded += added;
          totalUpdated += updated;
          totalSkipped += skipped;

          console.log(
            `Processed ${currentPath}: Added ${added}, Updated ${updated}, Skipped ${skipped} files`,
          );
        }

        if (!this._cancelRequested) {
          // Clean up orphaned tracks
          const orphansRemoved = await this.cleanupOrphanTracks(
            this._currentScanSessionId,
          );

          // Complete scan session
          await this.completeScanSession(this._currentScanSessionId, {
            found: totalFound,
            added: totalAdded,
            updated: totalUpdated,
          });

          console.log(
            `Library scan complete: ${totalAdded} added, ${totalUpdated} updated, ${totalSkipped} skipped, ${orphansRemoved} orphaned tracks removed`,
          );
        } else {
          // Mark scan as cancelled
          await this.completeScanSession(
            this._currentScanSessionId,
            {
              found: totalFound,
              added: totalAdded,
              updated: totalUpdated,
            },
            'cancelled',
          );
        }
      } catch (error) {
        console.error('Error during library load:', error);
        this.status = 'error';

        // Mark scan as failed
        if (this._currentScanSessionId) {
          await this.completeScanSession(
            this._currentScanSessionId,
            {
              found: 0,
              added: 0,
              updated: 0,
            },
            'failed',
          );
        }

        if (this._loadProgress) {
          this._loadProgress.error =
            error instanceof Error ? error.message : String(error);
        }
      } finally {
        // Clean up
        if (this.status === 'loading' || this._cancelRequested) {
          this.status = 'idle';
        }
        this._cancelRequested = false;
        this._currentLoadPromise = null;
        this._currentScanSessionId = null;
      }
    };

    this._currentLoadPromise = loadOperation();
    await this._currentLoadPromise;
  }

  /**
   * Get library statistics
   */
  public async getStats(): Promise<{
    totalTracks: number;
    totalArtists: number;
    totalAlbums: number;
    totalGenres: number;
  }> {
    try {
      const [trackCount, artistCount, albumCount, genreCount] =
        await Promise.all([
          this._db.select({ count: count() }).from(tracks),
          this._db.select({ count: count() }).from(artists),
          this._db.select({ count: count() }).from(albums),
          this._db.select({ count: count() }).from(genres),
        ]);

      return {
        totalTracks: trackCount[0].count,
        totalArtists: artistCount[0].count,
        totalAlbums: albumCount[0].count,
        totalGenres: genreCount[0].count,
      };
    } catch (error) {
      console.error('Error getting library stats:', error);
      return {
        totalTracks: 0,
        totalArtists: 0,
        totalAlbums: 0,
        totalGenres: 0,
      };
    }
  }

  /**
   * Get all artists
   */
  public async getArtists(): Promise<
    Array<{ id: number; name: string; trackCount: number }>
  > {
    try {
      const result = await this._db
        .select({
          id: artists.id,
          name: artists.name,
          trackCount: count(tracks.id),
        })
        .from(artists)
        .leftJoin(tracks, eq(artists.id, tracks.primaryArtistId))
        .groupBy(artists.id)
        .orderBy(asc(artists.name));

      return result;
    } catch (error) {
      console.error('Error getting artists:', error);
      return [];
    }
  }

  /**
   * Get all albums
   */
  public async getAlbums(): Promise<
    Array<{
      id: number;
      title: string;
      artistName: string | null;
      trackCount: number;
    }>
  > {
    try {
      const result = await this._db
        .select({
          id: albums.id,
          title: albums.title,
          artistName: albums.primaryArtistName,
          trackCount: count(tracks.id),
        })
        .from(albums)
        .leftJoin(tracks, eq(albums.id, tracks.albumId))
        .groupBy(albums.id)
        .orderBy(asc(albums.title));

      return result;
    } catch (error) {
      console.error('Error getting albums:', error);
      return [];
    }
  }
}
