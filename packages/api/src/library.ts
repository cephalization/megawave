import * as fs from 'fs/promises';
import * as mm from 'music-metadata';
import * as path from 'path';
import { z } from 'zod';

import {
  AlbumRepository,
  ArtRepository,
  ArtistRepository,
  GenreRepository,
  ScanRepository,
  TrackRepository,
  type TrackInsert,
} from 'db/repositories';
import type { DB } from 'db';

import { AudioTrack, generateContentHash, hasAudioFileExtension } from './audio.js';
import type { Album, Artist, PaginationMeta, Track } from './schemas.js';

export const scanProgressSchema = z.object({
  status: z.enum(['idle', 'loading', 'error']),
  scanActive: z.boolean(),
  filesDiscovered: z.number(),
  filesProcessed: z.number(),
  tracksAdded: z.number(),
  tracksUpdated: z.number(),
  tracksMissing: z.number(),
  tracksErrored: z.number(),
  lastError: z.string().optional(),
  startedAt: z.number().nullable(),
  finishedAt: z.number().nullable(),
});

export const audioLibraryStatusSchema = scanProgressSchema;
export type AudioLibraryStatus = z.infer<typeof scanProgressSchema>['status'];
export type LoadProgress = z.infer<typeof scanProgressSchema>;

type TrackWithPath = Track & {
  filePath: string;
  fileType: string;
};

type SerializedRow = {
  track: Awaited<ReturnType<TrackRepository['allWithArtIds']>>[number]['track'];
  artIds: number[];
};

export class Library {
  public status: AudioLibraryStatus = 'idle';
  private readonly trackRepo: TrackRepository;
  private readonly artistRepo: ArtistRepository;
  private readonly albumRepo: AlbumRepository;
  private readonly genreRepo: GenreRepository;
  private readonly artRepo: ArtRepository;
  private readonly scanRepo: ScanRepository;
  private currentScan: Promise<LoadProgress> | null = null;
  private progress: LoadProgress = this.emptyProgress();

  constructor(db: DB) {
    this.trackRepo = new TrackRepository(db);
    this.artistRepo = new ArtistRepository(db);
    this.albumRepo = new AlbumRepository(db);
    this.genreRepo = new GenreRepository(db);
    this.artRepo = new ArtRepository(db);
    this.scanRepo = new ScanRepository(db);
  }

  public async initialize(pathsToScan: string[]) {
    if ((await this.trackRepo.count()) === 0) {
      void this.load(pathsToScan);
      return;
    }

    this.status = 'idle';
    void this.load(pathsToScan);
  }

  public getLoadProgress(): LoadProgress {
    return this.progress;
  }

  public async rescan(pathsToScan: string[]) {
    if (this.currentScan) return this.progress;
    void this.load(pathsToScan);
    return this.progress;
  }

  public async getById(id: number): Promise<TrackWithPath | null> {
    const row = await this.trackRepo.findById(id);
    if (!row || row.status === 'missing') return null;

    const { hasExt, ext } = hasAudioFileExtension(row.fileName);
    if (!hasExt || !ext) return null;

    return {
      ...this.serializeRow({ track: row, artIds: [] }),
      filePath: row.filePath,
      fileType: ext,
    };
  }

  public async getArtById(id: number) {
    return this.artRepo.findById(id);
  }

  public async getEntries({
    limit,
    offset,
    filter,
    sort,
    subkeyfilter,
    albumId,
    artistId,
  }: {
    limit?: number;
    offset?: number;
    filter?: string;
    sort?: string;
    subkeyfilter?: string;
    albumId?: number;
    artistId?: number;
  }): Promise<{
    data: Track[];
    meta: PaginationMeta;
  }> {
    let allTracks = this.serializeRows(
      await this.getRowsWithArt({ filter, albumId, artistId }),
    );

    if (filter && albumId == null && artistId == null) {
      const sanitizedFilterQuery = filter.toLowerCase();
      const groupedByMatchingKey: {
        artist: Track[];
        name: Track[];
        album: Track[];
      } = { artist: [], name: [], album: [] };

      for (const track of allTracks) {
        const { match, key } = AudioTrack.matchesFilter(
          track,
          sanitizedFilterQuery,
        );
        if (match && key) groupedByMatchingKey[key].push(track);
      }

      allTracks = [
        ...groupedByMatchingKey.artist,
        ...groupedByMatchingKey.name,
        ...groupedByMatchingKey.album,
      ];
    }

    if (subkeyfilter) {
      const parts = subkeyfilter.split('-');
      if (parts.length >= 2) {
        const field = parts[0].toLocaleLowerCase();
        const term = parts.slice(1).join('-').toLocaleLowerCase();

        if (field === 'artist' || field === 'album' || field === 'name') {
          allTracks = allTracks.filter((track) => {
            const trackValue = track[field as keyof Track];
            if (Array.isArray(trackValue)) {
              return trackValue.some((val) =>
                val.toLocaleLowerCase().includes(term),
              );
            }
            if (typeof trackValue === 'string') {
              return trackValue.toLocaleLowerCase().includes(term);
            }
            return false;
          });
        }
      }
    }

    const getTrackNo = (track: Track): number => track.track?.no ?? Infinity;

    if (sort) {
      const reverse = sort.startsWith('-');
      const sortKeyString = (reverse ? sort.substring(1) : sort).toLowerCase();

      if (
        sortKeyString === 'name' ||
        sortKeyString === 'artist' ||
        sortKeyString === 'album'
      ) {
        const sortKey = sortKeyString as 'name' | 'artist' | 'album';
        allTracks.sort((a, b) => {
          let valA = AudioTrack.getAudioFileSortValue(a, sortKey);
          let valB = AudioTrack.getAudioFileSortValue(b, sortKey);

          if (reverse) {
            if (valA === 'zzzzz') valA = '';
            if (valB === 'zzzzz') valB = '';
          }

          let comparison = valA.localeCompare(valB);
          if (comparison === 0) {
            const trackNoA = getTrackNo(a);
            const trackNoB = getTrackNo(b);
            if (sortKey === 'album') {
              const shouldReverseTracks =
                reverse && subkeyfilter?.toLocaleLowerCase().startsWith('album-');
              comparison = shouldReverseTracks
                ? trackNoB - trackNoA
                : trackNoA - trackNoB;
            } else {
              comparison = trackNoA - trackNoB;
            }
          }
          return reverse ? comparison * -1 : comparison;
        });
      }
    } else {
      allTracks.sort((a, b) => {
        const albumA = AudioTrack.getAudioFileSortValue(a, 'album');
        const albumB = AudioTrack.getAudioFileSortValue(b, 'album');
        const comparison = albumA.localeCompare(albumB);
        return comparison === 0 ? getTrackNo(a) - getTrackNo(b) : comparison;
      });
    }

    const totalFilteredTracks = allTracks.length;
    const actualOffset = offset ?? 0;
    const actualLimit = limit ?? totalFilteredTracks;

    return {
      data: allTracks.slice(actualOffset, actualOffset + actualLimit),
      meta: {
        total: totalFilteredTracks,
        limit: actualLimit,
        offset: actualOffset,
        next: null,
        previous: null,
      },
    };
  }

  public async getAlbums(filter?: string): Promise<Album[]> {
    const rows = await this.getRowsWithArt({ filter });
    const albums = new Map<number, Album & { trackIds: Set<number> }>();

    for (const row of rows) {
      if (row.track.albumId == null || row.track.albumTitle == null) continue;
      const existing = albums.get(row.track.albumId);
      const album = existing ?? {
        id: row.track.albumId,
        name: row.track.albumTitle,
        artist: row.track.primaryArtistName ? [row.track.primaryArtistName] : null,
        art: null,
        trackCount: 0,
        trackIds: new Set<number>(),
      };

      album.trackIds.add(row.track.id);
      if (!album.art && row.artIds.length) {
        album.art = row.artIds.map((id) => `/api/library/art/${id}`);
      }
      albums.set(row.track.albumId, album);
    }

    return [...albums.values()]
      .map(({ trackIds, ...album }) => ({ ...album, trackCount: trackIds.size }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public async getArtists(filter?: string): Promise<Artist[]> {
    const rows = await this.getRowsWithArt({ filter });
    const artists = new Map<
      number,
      Artist & { trackIds: Set<number>; albumIds: Set<number> }
    >();

    for (const row of rows) {
      if (row.track.primaryArtistId == null || row.track.primaryArtistName == null) {
        continue;
      }
      const existing = artists.get(row.track.primaryArtistId);
      const artist = existing ?? {
        id: row.track.primaryArtistId,
        name: row.track.primaryArtistName,
        art: null,
        trackCount: 0,
        albumCount: 0,
        trackIds: new Set<number>(),
        albumIds: new Set<number>(),
      };

      artist.trackIds.add(row.track.id);
      if (row.track.albumId != null) artist.albumIds.add(row.track.albumId);
      if (!artist.art && row.artIds.length) {
        artist.art = row.artIds.map((id) => `/api/library/art/${id}`);
      }
      artists.set(row.track.primaryArtistId, artist);
    }

    return [...artists.values()]
      .map(({ trackIds, albumIds, ...artist }) => ({
        ...artist,
        trackCount: trackIds.size,
        albumCount: albumIds.size,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public async load(pathsToScan: string[]): Promise<LoadProgress> {
    if (this.currentScan) return this.currentScan;

    this.progress = this.emptyProgress();
    this.progress.status = 'loading';
    this.progress.scanActive = true;
    this.progress.startedAt = Date.now();
    this.status = 'loading';

    this.currentScan = this.scan(pathsToScan).finally(() => {
      this.currentScan = null;
    });

    return this.currentScan;
  }

  private async scan(pathsToScan: string[]): Promise<LoadProgress> {
    const session = await this.scanRepo.startSession(pathsToScan);

    try {
      const files = await this.findAudioFiles(pathsToScan);
      this.progress.filesDiscovered = files.length;

      for (const filePath of files) {
        await this.processFile(filePath, session.id);
        this.progress.filesProcessed++;
      }

      const missingIds = await this.scanRepo.getTracksNotInScan(session.id);
      await this.trackRepo.markMissing(missingIds);
      this.progress.tracksMissing = missingIds.length;

      this.progress.status = 'idle';
      this.status = 'idle';
      await this.scanRepo.endSession(session.id, {
        tracksFound: this.progress.filesDiscovered,
        tracksAdded: this.progress.tracksAdded,
        tracksUpdated: this.progress.tracksUpdated,
        tracksMissing: this.progress.tracksMissing,
        tracksErrored: this.progress.tracksErrored,
        lastError: this.progress.lastError,
        status: 'completed',
      });
    } catch (error) {
      this.progress.status = 'error';
      this.status = 'error';
      this.progress.lastError = error instanceof Error ? error.message : String(error);
      await this.scanRepo.endSession(session.id, {
        tracksFound: this.progress.filesDiscovered,
        tracksAdded: this.progress.tracksAdded,
        tracksUpdated: this.progress.tracksUpdated,
        tracksMissing: this.progress.tracksMissing,
        tracksErrored: this.progress.tracksErrored,
        lastError: this.progress.lastError,
        status: 'failed',
      });
    } finally {
      this.progress.scanActive = false;
      this.progress.finishedAt = Date.now();
    }

    return this.progress;
  }

  private async findAudioFiles(pathsToScan: string[]) {
    const audioFiles: string[] = [];
    const queue = [...pathsToScan];

    while (queue.length > 0) {
      const current = queue.shift()!;
      try {
        const entries = await fs.readdir(current, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.resolve(current, entry.name);
          if (entry.isDirectory()) {
            queue.push(fullPath);
          } else if (hasAudioFileExtension(entry.name).hasExt) {
            audioFiles.push(fullPath);
          }
        }
      } catch (error) {
        this.progress.tracksErrored++;
        this.progress.lastError = error instanceof Error ? error.message : String(error);
      }
    }

    return audioFiles;
  }

  private async processFile(filePath: string, scanSessionId: number) {
    try {
      const metadata = await mm.parseFile(filePath);
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const { ext } = hasAudioFileExtension(fileName);
      const common = metadata.common;
      const primaryArtistName = common.artists?.[0] ?? common.artist;
      const genreName = common.genre?.[0];
      const artist = primaryArtistName
        ? await this.artistRepo.findOrCreate(primaryArtistName)
        : null;
      const album = common.album
        ? await this.albumRepo.findOrCreate(common.album, artist?.id, common.year)
        : null;
      const genre = genreName ? await this.genreRepo.findOrCreate(genreName) : null;
      const contentHash = await generateContentHash(filePath);
      const now = Date.now();

      const values: TrackInsert = {
        contentHash,
        filePath: path.resolve(filePath),
        fileName,
        fileSize: stats.size,
        lastModified: stats.mtimeMs,
        title: common.title || fileName,
        trackNumber: common.track.no ?? undefined,
        totalTracks: common.track.of ?? undefined,
        discNumber: common.disk.no ?? undefined,
        totalDiscs: common.disk.of ?? undefined,
        duration: metadata.format.duration,
        albumId: album?.id,
        primaryArtistId: artist?.id,
        genreId: genre?.id,
        albumTitle: common.album,
        primaryArtistName,
        genreName,
        bitrate: metadata.format.bitrate,
        sampleRate: metadata.format.sampleRate,
        channels: metadata.format.numberOfChannels,
        codec: metadata.format.codec,
        dateAdded: now,
        dateModified: now,
      };

      const { track, created } = await this.trackRepo.upsertByContentHash(values);
      await this.scanRepo.recordTrackSeen(scanSessionId, track.id, filePath);
      if (created) this.progress.tracksAdded++;
      else this.progress.tracksUpdated++;

      const pictures = common.picture ?? [];
      await this.artRepo.replaceForTrack(
        track.id,
        pictures.map((picture) => ({
          mime: picture.format,
          data: Buffer.from(picture.data),
          description: picture.description,
        })),
      );

      if (!ext) throw new Error(`Unsupported audio extension for ${filePath}`);
    } catch (error) {
      this.progress.tracksErrored++;
      this.progress.lastError = error instanceof Error ? error.message : String(error);
    }
  }

  private async getRowsWithArt(options?: Parameters<TrackRepository['allWithArtIds']>[0]): Promise<SerializedRow[]> {
    const rows = await this.trackRepo.allWithArtIds(options);
    const byId = new Map<number, SerializedRow>();

    for (const row of rows) {
      const existing = byId.get(row.track.id);
      if (existing) {
        if (row.artId != null) existing.artIds.push(row.artId);
      } else {
        byId.set(row.track.id, {
          track: row.track,
          artIds: row.artId == null ? [] : [row.artId],
        });
      }
    }

    return [...byId.values()];
  }

  private serializeRows(rows: SerializedRow[]): Track[] {
    return rows.map((row) => this.serializeRow(row));
  }

  private serializeRow(row: SerializedRow): Track {
    const { track } = row;
    const { ext } = hasAudioFileExtension(track.fileName);

    return {
      id: track.id,
      albumId: track.albumId,
      artistId: track.primaryArtistId,
      name: track.title || track.fileName,
      album: track.albumTitle ? [track.albumTitle] : null,
      artist: track.primaryArtistName ? [track.primaryArtistName] : null,
      art: row.artIds.length
        ? row.artIds.map((id) => `/api/library/art/${id}`)
        : null,
      length: track.duration != null ? track.duration.toString() : '',
      link: `/api/library/songs/${track.id}`,
      fileType: ext ?? '',
      status: track.status as Track['status'],
      track: track.trackNumber != null ? { no: track.trackNumber } : undefined,
    };
  }

  private emptyProgress(): LoadProgress {
    return {
      status: 'idle',
      scanActive: false,
      filesDiscovered: 0,
      filesProcessed: 0,
      tracksAdded: 0,
      tracksUpdated: 0,
      tracksMissing: 0,
      tracksErrored: 0,
      startedAt: null,
      finishedAt: null,
    };
  }
}
