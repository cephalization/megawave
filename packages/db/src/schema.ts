import {
  sqliteTable,
  integer,
  text,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Artists table - normalized
export const artists = sqliteTable(
  "artists",
  {
    id: integer().primaryKey(),
    name: text().notNull(),
    sortName: text(), // For proper sorting (e.g., "Beatles, The")
    mbid: text(), // MusicBrainz ID for external linking
  },
  (table) => [
    index("artists_name_idx").on(table.name),
    index("artists_sort_name_idx").on(table.sortName),
  ]
);

// Albums table - normalized
export const albums = sqliteTable(
  "albums",
  {
    id: integer().primaryKey(),
    title: text().notNull(),
    sortTitle: text(),
    year: integer(),
    mbid: text(),
    // Denormalize primary artist for performance
    primaryArtistId: integer().references(() => artists.id),
    primaryArtistName: text(), // Denormalized for quick access
  },
  (table) => [
    index("albums_title_idx").on(table.title),
    index("albums_year_idx").on(table.year),
    index("albums_primary_artist_idx").on(table.primaryArtistId),
  ]
);

// Genres table - normalized
export const genres = sqliteTable(
  "genres",
  {
    id: integer().primaryKey(),
    name: text().notNull(),
  },
  (table) => [uniqueIndex("genres_name_unique_idx").on(table.name)]
);

// Main tracks table
export const tracks = sqliteTable(
  "tracks",
  {
    id: integer().primaryKey(),

    // Content identification (for duplicate detection)
    contentHash: text().notNull(), // Primary hash based on content + metadata
    filePath: text().notNull(), // Current file location
    fileName: text().notNull(),
    fileSize: integer(),
    lastModified: integer(), // Unix timestamp

    // Basic metadata
    title: text().notNull(),
    sortTitle: text(),
    trackNumber: integer(),
    totalTracks: integer(),
    discNumber: integer(),
    totalDiscs: integer(),
    duration: real(), // seconds, use real for precision

    // Foreign keys (normalized)
    albumId: integer().references(() => albums.id),
    primaryArtistId: integer().references(() => artists.id),
    genreId: integer().references(() => genres.id),

    // Denormalized fields for performance (avoid JOINs in common queries)
    albumTitle: text(),
    primaryArtistName: text(),
    genreName: text(),

    // Technical metadata
    bitrate: integer(),
    sampleRate: integer(),
    channels: integer(),
    codec: text(),

    // Timestamps
    dateAdded: integer(), // Unix timestamp
    dateModified: integer(), // Unix timestamp
  },
  (table) => [
    // Critical indexes for performance
    uniqueIndex("tracks_content_hash_idx").on(table.contentHash),
    index("tracks_file_path_idx").on(table.filePath),
    index("tracks_album_idx").on(table.albumId),
    index("tracks_artist_idx").on(table.primaryArtistId),
    index("tracks_title_idx").on(table.title),

    // Composite indexes for common query patterns
    index("tracks_album_track_idx").on(
      table.albumId,
      table.discNumber,
      table.trackNumber
    ),
    index("tracks_artist_album_idx").on(table.primaryArtistId, table.albumId),
  ]
);

// Many-to-many relationships

// Track-Artist relationships (for featuring, collaborations)
export const trackArtists = sqliteTable(
  "track_artists",
  {
    id: integer().primaryKey(),
    trackId: integer()
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    artistId: integer()
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    role: text(), // 'primary', 'featured', 'composer', 'producer', etc.
    order: integer(), // For preserving artist order
  },
  (table) => [
    index("track_artists_track_idx").on(table.trackId),
    index("track_artists_artist_idx").on(table.artistId),
    uniqueIndex("track_artists_unique_idx").on(
      table.trackId,
      table.artistId,
      table.role
    ),
  ]
);

// Album-Artist relationships (for compilation albums)
export const albumArtists = sqliteTable(
  "album_artists",
  {
    id: integer().primaryKey(),
    albumId: integer()
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    artistId: integer()
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    role: text(), // 'primary', 'various', 'compiler', etc.
  },
  (table) => [
    index("album_artists_album_idx").on(table.albumId),
    index("album_artists_artist_idx").on(table.artistId),
  ]
);

// File tracking for scan management
export const scanSessions = sqliteTable("scan_sessions", {
  id: integer().primaryKey(),
  startTime: integer().notNull(),
  endTime: integer(),
  pathsScanned: text(), // JSON array of scanned paths
  tracksFound: integer(),
  tracksAdded: integer(),
  tracksUpdated: integer(),
  status: text(), // 'running', 'completed', 'failed', 'cancelled'
});

// Track which files were seen in which scans (for orphan cleanup)
export const trackScans = sqliteTable(
  "track_scans",
  {
    trackId: integer()
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    scanSessionId: integer()
      .notNull()
      .references(() => scanSessions.id, { onDelete: "cascade" }),
    filePath: text().notNull(), // Path when seen in this scan
  },
  (table) => [
    index("track_scans_track_idx").on(table.trackId),
    index("track_scans_scan_idx").on(table.scanSessionId),
  ]
);
