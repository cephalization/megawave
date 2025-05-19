import * as path from "path";
import * as crypto from "crypto";
import NodeID3 from "node-id3";
import { Buffer } from "buffer";
import type { Track } from "./schemas.js";

// Interfaces matching Python's serialized structures and node-id3 data
export interface ArtItem {
  mime: string;
  imageBuffer: Buffer;
  description?: string;
  type?: { id: number; name: string };
}

export const VALID_AUDIO_EXTENSIONS = ["mp3", "wav"]; // wav support by node-id3 might be limited to ID3 tags within wav

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
  public tags?: NodeID3.Tags;
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
      this.ok = false; // Mark as not ok if not a valid extension or no extension
      return;
    }
  }

  public async initialize(): Promise<void> {
    // node-id3 primarily supports ID3 tags (common in MP3s).
    // WAV files can contain ID3 tags, but it's less common.
    // Other types might not be supported.
    if (!["mp3", "wav"].includes(this.fileType)) {
      console.warn(
        `File type ${this.fileType} for ${this.fileName} may not be well supported by node-id3 for tag extraction.`
      );
    }

    try {
      const tags = await NodeID3.Promise.read(this.filePath);
      if (tags && typeof tags !== "boolean") {
        // Check if tags is an object
        this.tags = tags;
        this.parseTags();
        this.ok = true;
      } else {
        // NodeID3.Promise.read might resolve with 'false' or an empty object if no tags found or error.
        console.warn(
          `No tags found or error reading tags for ${this.filePath}. Received:`,
          tags
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

  private parseTags(): void {
    if (!this.tags) return;

    const rawTags = (this.tags.raw || {}) as Record<string, any>; // Cast to Record<string, any> for easier access

    this.title = this.tags.title || this.fileName;

    // Artist: TPE1. node-id3 provides `tags.artist`.
    let artistSource = this.tags.artist || rawTags["TPE1"];
    if (artistSource) {
      this.artists = Array.isArray(artistSource)
        ? artistSource.map(String)
        : [String(artistSource)];
    }

    // Album: TALB. node-id3 provides `tags.album`.
    let albumSource = this.tags.album || rawTags["TALB"];
    if (albumSource) {
      this.album = Array.isArray(albumSource)
        ? albumSource.map(String)
        : [String(albumSource)];
    }

    // Length: TLEN (milliseconds string).
    const tlen = (this.tags as any).length || rawTags["TLEN"]; // `tags.length` is an alias for TLEN
    if (tlen && /^\\d+$/.test(String(tlen))) {
      this.lengthSeconds = parseInt(String(tlen), 10) / 1000;
    }

    // Track number: TRCK. Can be "number" or "number/total".
    const trck = this.tags.trackNumber || rawTags["TRCK"];
    if (trck) {
      const parts = String(trck).split("/");
      const trackNo = parseInt(parts[0], 10);
      if (!isNaN(trackNo)) {
        this.trackInfo = { no: trackNo };
        if (parts.length > 1) {
          const totalTracks = parseInt(parts[1], 10);
          if (!isNaN(totalTracks)) {
            this.trackInfo.total = totalTracks;
          }
        }
      }
    }

    // Art: APIC. `tags.image` is one, `tags.raw.APIC` could be multiple or one.
    // Define a type for the expected structure of an image frame object
    type ImageFrameObject = {
      mime: string;
      imageBuffer: Buffer;
      description?: string;
      type?: { id: number; name: string };
    };

    const artFramesToProcess: ImageFrameObject[] = [];

    const processFrame = (frame: any) => {
      if (
        frame &&
        typeof frame === "object" &&
        frame.mime &&
        frame.imageBuffer
      ) {
        artFramesToProcess.push(frame as ImageFrameObject);
      }
    };

    if (rawTags && rawTags["APIC"]) {
      const apicData = rawTags["APIC"];
      const apicArray = Array.isArray(apicData) ? apicData : [apicData];
      apicArray.forEach(processFrame);
    } else if (this.tags.image) {
      processFrame(this.tags.image); // this.tags.image can be string | object
    }

    if (artFramesToProcess.length > 0) {
      this.artCacheIds = artFramesToProcess.map((frame) =>
        addFrameToCache({
          // addFrameToCache expects ArtItem which matches ImageFrameObject structure
          mime: frame.mime,
          imageBuffer: frame.imageBuffer,
          description: frame.description,
          type: frame.type,
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
      length: this.lengthSeconds?.toString() || "",
      link: `/api/library/songs/${this.id}`,
      // meta: this.tags?.raw || this.tags, // Prefer raw tags for detailed metadata
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
