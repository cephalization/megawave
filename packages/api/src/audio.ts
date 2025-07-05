import * as mm from 'music-metadata';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { DB } from 'db';
import { eq, and } from 'db/drizzle';
import { tracks, artists, albums, genres, trackArtists } from 'db/schema';

import type { Track } from './schemas.js';

export interface ArtItem {
  mime: string;
  imageBuffer: Buffer;
  description?: string;
  type?: { id: number; name: string };
}

export const VALID_AUDIO_EXTENSIONS = ['mp3', 'wav'];

export function hasAudioFileExtension(fileName: string): {
  hasExt: boolean;
  ext?: string;
} {
  const parts = fileName.split('.');
  if (parts.length < 2) return { hasExt: false };
  const fileExt = parts.pop()!.toLowerCase();
  if (VALID_AUDIO_EXTENSIONS.includes(fileExt)) {
    return { hasExt: true, ext: fileExt };
  }
  return { hasExt: false };
}

export function getMediaType(ext: string): string {
  if (ext === 'mp3') {
    return 'audio/mpeg';
  } else if (ext === 'wav') {
    return 'audio/wav';
  }
  return '';
}

/**
 * Generate a robust hash that can be used as a content identifier for an audio file.
 * Uses multiple stable identifiers including file content, metadata, and fallbacks.
 * This approach is more resilient to file moves and metadata changes.
 */
export function audioFileHash(
  filePath: string,
  metadata?: mm.IAudioMetadata,
  fileStats?: { size: number; mtime: Date },
): string {
  const hash = crypto.createHash('sha256');

  // File content identifiers (most stable)
  if (fileStats?.size) {
    hash.update(`size:${fileStats.size}`);
  }
  if (fileStats?.mtime) {
    hash.update(`mtime:${fileStats.mtime.getTime()}`);
  }

  // Metadata identifiers (moderately stable)
  if (metadata?.common) {
    const common = metadata.common;
    if (common.title) hash.update(`title:${common.title.toLowerCase().trim()}`);
    if (common.artist)
      hash.update(`artist:${common.artist.toLowerCase().trim()}`);
    if (common.album) hash.update(`album:${common.album.toLowerCase().trim()}`);
    if (common.track?.no) hash.update(`trackno:${common.track.no}`);
    if (common.year) hash.update(`year:${common.year}`);
  }

  // Duration (fairly stable)
  if (metadata?.format?.duration) {
    // Round to nearest second to handle minor encoding differences
    hash.update(`duration:${Math.round(metadata.format.duration)}`);
  }

  // Fallback to filename (least stable but necessary)
  const fileName = path.basename(filePath).toLowerCase();
  hash.update(`filename:${fileName}`);

  return hash.digest('hex');
}

/**
 * Enhanced content hash that includes more file-specific data
 */
export async function generateContentHash(filePath: string): Promise<string> {
  try {
    const stats = await fs.stat(filePath);
    const metadata = await mm.parseFile(filePath);

    return audioFileHash(filePath, metadata, {
      size: stats.size,
      mtime: stats.mtime,
    });
  } catch (error) {
    console.warn(`Failed to generate content hash for ${filePath}:`, error);
    // Fallback to simple path-based hash
    return audioFileHash(filePath);
  }
}

/**
 * Collision detection and resolution utilities
 */
export interface HashCollisionInfo {
  originalHash: string;
  resolvedHash: string;
  collisionCount: number;
  isCollision: boolean;
}

export class HashCollisionResolver {
  private static collisionCounts = new Map<string, number>();

  /**
   * Resolve hash collisions by appending a counter suffix
   */
  static resolveCollision(
    originalHash: string,
    existingTracks: { contentHash: string; filePath: string }[],
  ): HashCollisionInfo {
    const existingTrack = existingTracks.find(
      (t) => t.contentHash === originalHash,
    );

    if (!existingTrack) {
      return {
        originalHash,
        resolvedHash: originalHash,
        collisionCount: 0,
        isCollision: false,
      };
    }

    // Check if it's a real collision (same hash, different file)
    // This could happen with very similar files or hash algorithm limitations
    let collisionCount = this.collisionCounts.get(originalHash) || 0;
    collisionCount++;
    this.collisionCounts.set(originalHash, collisionCount);

    const resolvedHash = `${originalHash}-${collisionCount}`;

    return {
      originalHash,
      resolvedHash,
      collisionCount,
      isCollision: true,
    };
  }

  /**
   * Verify if two tracks are actually different despite having the same hash
   */
  static verifyCollision(track1: any, track2: any): boolean {
    // Compare key identifying fields
    const fields = ['title', 'artist', 'album', 'duration', 'trackNumber'];

    for (const field of fields) {
      if (track1[field] !== track2[field]) {
        return true; // Different tracks
      }
    }

    return false; // Likely the same track
  }
}

// Simple In-Memory Art Cache
interface CachedArt {
  id: string;
  mime: string;
  buffer: Buffer;
  link: string;
}
const ALBUM_ART_CACHE: Record<string, CachedArt> = {};

function addFrameToCache(frame: ArtItem): string {
  const id = crypto.randomBytes(16).toString('hex');
  ALBUM_ART_CACHE[id] = {
    id,
    mime: frame.mime,
    buffer: frame.imageBuffer,
    link: `/api/library/art/${id}`,
  };
  return id;
}

// This function would be used by an API endpoint to serve art
export function getArtFromCache(id: string): CachedArt | undefined {
  return ALBUM_ART_CACHE[id];
}

export class AudioTrack {
  private _db: DB;
  public ok: boolean = false;
  public filePath: string;
  public fileName: string;
  public fileDir: string;
  public fileType: string = '';
  public id?: number; // SQLite auto-increment ID
  public contentHash?: string; // Content-based hash for duplicate detection
  public metadata?: mm.IAudioMetadata;
  public artCacheIds: string[] = [];

  // Parsed common properties
  public title?: string;
  public artists?: string[];
  public album?: string[];
  public lengthSeconds?: number;
  public trackInfo?: { no: number; total?: number };

  constructor(filePath: string, db: DB) {
    this.filePath = path.resolve(filePath);
    this.fileName = path.basename(this.filePath);
    this.fileDir = path.dirname(this.filePath);
    this._db = db;

    const { hasExt, ext } = hasAudioFileExtension(this.fileName);
    if (hasExt && ext) {
      this.fileType = ext;
    } else {
      this.ok = false;
      return;
    }
  }

  public async initialize(): Promise<void> {
    try {
      const metadata = await mm.parseFile(this.filePath);
      if (metadata) {
        this.metadata = metadata;
        this.parseMetadata();
        this.contentHash = await generateContentHash(this.filePath);
        this.ok = true;
      } else {
        console.warn(
          `No metadata found or error reading metadata for ${this.filePath}. Received:`,
          metadata,
        );
        this.ok = false;
      }
    } catch (error) {
      console.error(
        `Error initializing AudioTrack for ${this.filePath}:`,
        error,
      );
      this.ok = false;
    }
  }

  private parseMetadata(): void {
    if (!this.metadata) return;

    const common = this.metadata.common;
    const format = this.metadata.format;

    this.title = common.title || this.fileName;

    // Artist: common.artist (string) or common.artists (string[])
    if (common.artists && common.artists.length > 0) {
      this.artists = common.artists.map(String);
    } else if (common.artist) {
      this.artists = [String(common.artist)];
    } else {
      this.artists = undefined;
    }

    // Album: common.album (string)
    if (common.album) {
      this.album = [String(common.album)]; // Track schema expects string[]
    } else {
      this.album = undefined;
    }

    // Length: format.duration (seconds, number)
    if (format && typeof format.duration === 'number') {
      this.lengthSeconds = format.duration;
    } else {
      // If format.duration is not available, lengthSeconds will be undefined.
      this.lengthSeconds = undefined;
    }

    // Track number: common.track ({ no: number, of?: number })
    const commonTrack = common.track;
    if (commonTrack && typeof commonTrack.no === 'number') {
      this.trackInfo = { no: commonTrack.no };
      if (typeof commonTrack.of === 'number') {
        this.trackInfo.total = commonTrack.of;
      }
    }

    // Art: common.picture (Array of IPicture)
    // Clear previous art cache IDs if any (e.g., if re-initializing)
    this.artCacheIds = [];
    if (common.picture && common.picture.length > 0) {
      this.artCacheIds = common.picture.map((pic: mm.IPicture) =>
        addFrameToCache({
          mime: pic.format,
          imageBuffer: Buffer.from(pic.data),
          description: pic.description,
        }),
      );
    }
  }

  /**
   * Save or update the track in the database
   */
  public async save(): Promise<void> {
    if (!this.ok || !this.contentHash) {
      throw new Error('Track not properly initialized');
    }

    const stats = await fs.stat(this.filePath);
    const now = Date.now();

    try {
      // Check if track already exists by content hash
      const existingTrack = await this._db
        .select()
        .from(tracks)
        .where(eq(tracks.contentHash, this.contentHash))
        .limit(1);

      if (existingTrack.length > 0) {
        // Update existing track
        const track = existingTrack[0];
        this.id = track.id;

        // Update track data
        await this._db
          .update(tracks)
          .set({
            filePath: this.filePath,
            fileName: this.fileName,
            fileSize: stats.size,
            lastModified: stats.mtime.getTime(),
            title: this.title || this.fileName,
            trackNumber: this.trackInfo?.no || null,
            totalTracks: this.trackInfo?.total || null,
            duration: this.lengthSeconds || null,
            bitrate: this.metadata?.format?.bitrate || null,
            sampleRate: this.metadata?.format?.sampleRate || null,
            channels: this.metadata?.format?.numberOfChannels || null,
            codec: this.metadata?.format?.codec || null,
            dateModified: now,
          })
          .where(eq(tracks.id, this.id));
      } else {
        // Create new track
        const insertResult = await this._db
          .insert(tracks)
          .values({
            contentHash: this.contentHash,
            filePath: this.filePath,
            fileName: this.fileName,
            fileSize: stats.size,
            lastModified: stats.mtime.getTime(),
            title: this.title || this.fileName,
            trackNumber: this.trackInfo?.no || null,
            totalTracks: this.trackInfo?.total || null,
            duration: this.lengthSeconds || null,
            bitrate: this.metadata?.format?.bitrate || null,
            sampleRate: this.metadata?.format?.sampleRate || null,
            channels: this.metadata?.format?.numberOfChannels || null,
            codec: this.metadata?.format?.codec || null,
            dateAdded: now,
            dateModified: now,
          })
          .returning({ id: tracks.id });

        this.id = insertResult[0].id;
      }

      // Handle normalized entities
      await this.saveNormalizedEntities();
    } catch (error) {
      console.error(`Error saving track ${this.filePath}:`, error);
      throw error;
    }
  }

  /**
   * Save normalized entities (artists, albums, genres) and their relationships
   */
  private async saveNormalizedEntities(): Promise<void> {
    if (!this.id) return;

    let albumId: number | null = null;
    let primaryArtistId: number | null = null;
    let genreId: number | null = null;

    // Handle album
    if (this.album && this.album.length > 0) {
      const albumTitle = this.album[0];
      albumId = await this.getOrCreateAlbum(albumTitle);
    }

    // Handle artists
    if (this.artists && this.artists.length > 0) {
      const primaryArtistName = this.artists[0];
      primaryArtistId = await this.getOrCreateArtist(primaryArtistName);

      // Clear existing track-artist relationships
      await this._db
        .delete(trackArtists)
        .where(eq(trackArtists.trackId, this.id));

      // Create new track-artist relationships
      for (let i = 0; i < this.artists.length; i++) {
        const artistName = this.artists[i];
        const artistId = await this.getOrCreateArtist(artistName);

        await this._db.insert(trackArtists).values({
          trackId: this.id,
          artistId: artistId,
          role: i === 0 ? 'primary' : 'featured',
          order: i,
        });
      }
    }

    // Handle genre (if available in metadata)
    if (this.metadata?.common?.genre && this.metadata.common.genre.length > 0) {
      const genreName = this.metadata.common.genre[0];
      genreId = await this.getOrCreateGenre(genreName);
    }

    // Update track with normalized IDs and denormalized data
    await this._db
      .update(tracks)
      .set({
        albumId,
        primaryArtistId,
        genreId,
        albumTitle: this.album?.[0] || null,
        primaryArtistName: this.artists?.[0] || null,
        genreName: this.metadata?.common?.genre?.[0] || null,
      })
      .where(eq(tracks.id, this.id));
  }

  /**
   * Get or create an artist
   */
  private async getOrCreateArtist(name: string): Promise<number> {
    const existing = await this._db
      .select()
      .from(artists)
      .where(eq(artists.name, name))
      .limit(1);

    if (existing.length > 0) {
      return existing[0].id;
    }

    const result = await this._db
      .insert(artists)
      .values({
        name,
        sortName: name, // Could be enhanced with proper sort name logic
      })
      .returning({ id: artists.id });

    return result[0].id;
  }

  /**
   * Get or create an album
   */
  private async getOrCreateAlbum(title: string): Promise<number> {
    const existing = await this._db
      .select()
      .from(albums)
      .where(eq(albums.title, title))
      .limit(1);

    if (existing.length > 0) {
      return existing[0].id;
    }

    const result = await this._db
      .insert(albums)
      .values({
        title,
        sortTitle: title, // Could be enhanced with proper sort title logic
        year: this.metadata?.common?.year || null,
      })
      .returning({ id: albums.id });

    return result[0].id;
  }

  /**
   * Get or create a genre
   */
  private async getOrCreateGenre(name: string): Promise<number> {
    const existing = await this._db
      .select()
      .from(genres)
      .where(eq(genres.name, name))
      .limit(1);

    if (existing.length > 0) {
      return existing[0].id;
    }

    const result = await this._db
      .insert(genres)
      .values({
        name,
      })
      .returning({ id: genres.id });

    return result[0].id;
  }

  /**
   * Load track from database by ID
   */
  public static async loadById(id: number, db: DB): Promise<AudioTrack | null> {
    const result = await db
      .select()
      .from(tracks)
      .where(eq(tracks.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const trackData = result[0];
    const audioTrack = new AudioTrack(trackData.filePath, db);

    // Set the data from database
    audioTrack.id = trackData.id;
    audioTrack.contentHash = trackData.contentHash;
    audioTrack.title = trackData.title;
    audioTrack.lengthSeconds = trackData.duration || undefined;
    audioTrack.trackInfo = trackData.trackNumber
      ? {
          no: trackData.trackNumber,
          total: trackData.totalTracks || undefined,
        }
      : undefined;

    // Set denormalized data
    if (trackData.primaryArtistName) {
      audioTrack.artists = [trackData.primaryArtistName];
    }
    if (trackData.albumTitle) {
      audioTrack.album = [trackData.albumTitle];
    }

    audioTrack.ok = true;
    return audioTrack;
  }

  /**
   * Load track from database by content hash
   */
  public static async loadByContentHash(
    contentHash: string,
    db: DB,
  ): Promise<AudioTrack | null> {
    const result = await db
      .select()
      .from(tracks)
      .where(eq(tracks.contentHash, contentHash))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return AudioTrack.loadById(result[0].id, db);
  }

  public serialize(): Track | null {
    if (!this.ok || !this.id) return null;

    const serializedArt =
      this.artCacheIds.length > 0
        ? (this.artCacheIds
            .map((id) => ALBUM_ART_CACHE[id]?.link)
            .filter(Boolean) as string[])
        : undefined;

    return {
      id: this.id.toString(), // Convert to string for API compatibility
      name: this.title || this.fileName,
      album: this.album || null,
      artist: this.artists || null,
      art: serializedArt || null,
      length:
        this.lengthSeconds !== undefined ? this.lengthSeconds.toString() : '',
      link: `/api/library/songs/${this.id}`,
      fileType: this.fileType,
      track: this.trackInfo,
    };
  }

  public static matchesFilter(
    audio: Track,
    filterTerm: string,
  ): { match: boolean; key?: 'name' | 'artist' | 'album' } {
    const sanitizedFilterTerm = filterTerm.toLowerCase();

    if (!audio) return { match: false };

    if (audio.name?.toLowerCase().includes(sanitizedFilterTerm)) {
      return { match: true, key: 'name' };
    }

    if (audio.artist) {
      for (const artist of audio.artist) {
        // Assumes audio.artist is string[]
        if (artist.toLowerCase().includes(sanitizedFilterTerm)) {
          return { match: true, key: 'artist' };
        }
      }
    }

    if (audio.album) {
      for (const album of audio.album) {
        // Assumes audio.album is string[]
        if (album.toLowerCase().includes(sanitizedFilterTerm)) {
          return { match: true, key: 'album' };
        }
      }
    }
    return { match: false };
  }

  public static getSafeArtist(audio: Track): string {
    if (audio.artist && audio.artist.length > 0) {
      return audio.artist.join(', ');
    }
    return '';
  }

  public static getAudioFileSortValue(
    audio: Track,
    sort: 'artist' | 'album' | 'name',
  ): string {
    if (sort === 'artist') {
      return AudioTrack.getSafeArtist(audio).toLocaleLowerCase() || 'zzzzz';
    } else if (sort === 'album') {
      // Assumes album is string[]
      return audio.album?.[0]?.toLocaleLowerCase() || 'zzzzz';
    } else if (sort === 'name') {
      return audio.name?.toLocaleLowerCase() || 'zzzzz';
    }
    return '';
  }
}
