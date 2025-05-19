import * as path from "path";
import * as crypto from "crypto";
import * as mm from "music-metadata";
import { Buffer } from "buffer";
import type { Track } from "./schemas.js";

export interface ArtItem {
  mime: string;
  imageBuffer: Buffer;
  description?: string;
  type?: { id: number; name: string };
}

export const VALID_AUDIO_EXTENSIONS = ["mp3", "wav"];

export function hasAudioFileExtension(fileName: string): {
  hasExt: boolean;
  ext?: string;
} {
  const parts = fileName.split(".");
  if (parts.length < 2) return { hasExt: false };
  const fileExt = parts.pop()!.toLowerCase();
  if (VALID_AUDIO_EXTENSIONS.includes(fileExt)) {
    return { hasExt: true, ext: fileExt };
  }
  return { hasExt: false };
}

export function getMediaType(ext: string): string {
  if (ext === "mp3") {
    return "audio/mpeg";
  } else if (ext === "wav") {
    return "audio/wav";
  }
  return "";
}

/**
 * Generate a hash that can be used as an ID for an audio file.
 * Given the same inputs, the same hash should be produced.
 * This will allow us to parse a file multiple times and get the same result.
 */
export function audioFileHash(filePath: string) {
  const hash = crypto.createHash("sha256");
  hash.update(filePath);
  return hash.digest("hex");
}

// Simple In-Memory Art Cache (similar to Python's ALBUM_ART_CACHE)
interface CachedArt {
  id: string;
  mime: string;
  buffer: Buffer;
  link: string;
}
const ALBUM_ART_CACHE: Record<string, CachedArt> = {};

function addFrameToCache(frame: ArtItem): string {
  const id = crypto.randomBytes(16).toString("hex");
  ALBUM_ART_CACHE[id] = {
    id,
    mime: frame.mime,
    buffer: frame.imageBuffer,
    link: `/api/library/art/${id}`, // Example link structure
  };
  return id;
}

// This function would be used by an API endpoint to serve art
export function getArtFromCache(id: string): CachedArt | undefined {
  return ALBUM_ART_CACHE[id];
}

export class AudioTrack {
  public ok: boolean = false;
  public filePath: string;
  public fileName: string;
  public fileDir: string;
  public fileType: string = "";
  public id: string;
  public metadata?: mm.IAudioMetadata;
  public artCacheIds: string[] = [];

  // Parsed common properties
  public title?: string;
  public artists?: string[];
  public album?: string[];
  public lengthSeconds?: number;
  public trackInfo?: { no: number; total?: number };

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
    this.fileName = path.basename(this.filePath);
    this.fileDir = path.dirname(this.filePath);
    this.id = audioFileHash(this.filePath);

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
          metadata
        );
        this.ok = false;
      }
    } catch (error) {
      console.error(
        `Error initializing AudioTrack for ${this.filePath}:`,
        error
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
    if (format && typeof format.duration === "number") {
      this.lengthSeconds = format.duration;
    } else {
      // If format.duration is not available, lengthSeconds will be undefined.
      this.lengthSeconds = undefined;
    }

    // Track number: common.track ({ no: number, of?: number })
    const commonTrack = common.track;
    if (commonTrack && typeof commonTrack.no === "number") {
      this.trackInfo = { no: commonTrack.no };
      if (typeof commonTrack.of === "number") {
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
        })
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
        this.lengthSeconds !== undefined ? this.lengthSeconds.toString() : "",
      link: `/api/library/songs/${this.id}`,
      fileType: this.fileType,
      track: this.trackInfo,
    };
  }

  public static matchesFilter(
    audio: Track,
    filterTerm: string
  ): { match: boolean; key?: "name" | "artist" | "album" } {
    const sanitizedFilterTerm = filterTerm.toLowerCase();

    if (!audio) return { match: false };

    if (audio.name?.toLowerCase().includes(sanitizedFilterTerm)) {
      return { match: true, key: "name" };
    }

    if (audio.artist) {
      for (const artist of audio.artist) {
        // Assumes audio.artist is string[]
        if (artist.toLowerCase().includes(sanitizedFilterTerm)) {
          return { match: true, key: "artist" };
        }
      }
    }

    if (audio.album) {
      for (const album of audio.album) {
        // Assumes audio.album is string[]
        if (album.toLowerCase().includes(sanitizedFilterTerm)) {
          return { match: true, key: "album" };
        }
      }
    }
    return { match: false };
  }

  public static getSafeArtist(audio: Track): string {
    if (audio.artist && audio.artist.length > 0) {
      return audio.artist.join(", ");
    }
    return "";
  }

  public static getAudioFileSortValue(
    audio: Track,
    sort: "artist" | "album" | "name"
  ): string {
    if (sort === "artist") {
      return AudioTrack.getSafeArtist(audio).toLocaleLowerCase() || "zzzzz";
    } else if (sort === "album") {
      // Assumes album is string[]
      return audio.album?.[0]?.toLocaleLowerCase() || "zzzzz";
    } else if (sort === "name") {
      return audio.name?.toLocaleLowerCase() || "zzzzz";
    }
    return "";
  }
}
