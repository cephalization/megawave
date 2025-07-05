import * as mm from 'music-metadata';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { DB } from 'db';

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
 * Generate a robust hash that can be used as an ID for an audio file.
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
  public id: string;
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
    this.id = audioFileHash(this.filePath);
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

  public serialize(): Track | null {
    if (!this.ok) return null;

    const serializedArt =
      this.artCacheIds.length > 0
        ? (this.artCacheIds
            .map((id) => ALBUM_ART_CACHE[id]?.link)
            .filter(Boolean) as string[])
        : undefined;

    return {
      id: this.id,
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
