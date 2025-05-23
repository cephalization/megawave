CREATE TABLE `album_artists` (
	`id` integer PRIMARY KEY NOT NULL,
	`albumId` integer NOT NULL,
	`artistId` integer NOT NULL,
	`role` text,
	FOREIGN KEY (`albumId`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artistId`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `album_artists_album_idx` ON `album_artists` (`albumId`);--> statement-breakpoint
CREATE INDEX `album_artists_artist_idx` ON `album_artists` (`artistId`);--> statement-breakpoint
CREATE TABLE `albums` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`sortTitle` text,
	`year` integer,
	`mbid` text,
	`primaryArtistId` integer,
	`primaryArtistName` text,
	FOREIGN KEY (`primaryArtistId`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `albums_title_idx` ON `albums` (`title`);--> statement-breakpoint
CREATE INDEX `albums_year_idx` ON `albums` (`year`);--> statement-breakpoint
CREATE INDEX `albums_primary_artist_idx` ON `albums` (`primaryArtistId`);--> statement-breakpoint
CREATE TABLE `artists` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sortName` text,
	`mbid` text
);
--> statement-breakpoint
CREATE INDEX `artists_name_idx` ON `artists` (`name`);--> statement-breakpoint
CREATE INDEX `artists_sort_name_idx` ON `artists` (`sortName`);--> statement-breakpoint
CREATE TABLE `genres` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `genres_name_unique_idx` ON `genres` (`name`);--> statement-breakpoint
CREATE TABLE `scan_sessions` (
	`id` integer PRIMARY KEY NOT NULL,
	`startTime` integer NOT NULL,
	`endTime` integer,
	`pathsScanned` text,
	`tracksFound` integer,
	`tracksAdded` integer,
	`tracksUpdated` integer,
	`status` text
);
--> statement-breakpoint
CREATE TABLE `track_artists` (
	`id` integer PRIMARY KEY NOT NULL,
	`trackId` integer NOT NULL,
	`artistId` integer NOT NULL,
	`role` text,
	`order` integer,
	FOREIGN KEY (`trackId`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artistId`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `track_artists_track_idx` ON `track_artists` (`trackId`);--> statement-breakpoint
CREATE INDEX `track_artists_artist_idx` ON `track_artists` (`artistId`);--> statement-breakpoint
CREATE UNIQUE INDEX `track_artists_unique_idx` ON `track_artists` (`trackId`,`artistId`,`role`);--> statement-breakpoint
CREATE TABLE `track_scans` (
	`trackId` integer NOT NULL,
	`scanSessionId` integer NOT NULL,
	`filePath` text NOT NULL,
	FOREIGN KEY (`trackId`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scanSessionId`) REFERENCES `scan_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `track_scans_track_idx` ON `track_scans` (`trackId`);--> statement-breakpoint
CREATE INDEX `track_scans_scan_idx` ON `track_scans` (`scanSessionId`);--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` integer PRIMARY KEY NOT NULL,
	`contentHash` text NOT NULL,
	`filePath` text NOT NULL,
	`fileName` text NOT NULL,
	`fileSize` integer,
	`lastModified` integer,
	`title` text NOT NULL,
	`sortTitle` text,
	`trackNumber` integer,
	`totalTracks` integer,
	`discNumber` integer,
	`totalDiscs` integer,
	`duration` real,
	`albumId` integer,
	`primaryArtistId` integer,
	`genreId` integer,
	`albumTitle` text,
	`primaryArtistName` text,
	`genreName` text,
	`bitrate` integer,
	`sampleRate` integer,
	`channels` integer,
	`codec` text,
	`dateAdded` integer,
	`dateModified` integer,
	FOREIGN KEY (`albumId`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`primaryArtistId`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`genreId`) REFERENCES `genres`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracks_content_hash_idx` ON `tracks` (`contentHash`);--> statement-breakpoint
CREATE INDEX `tracks_file_path_idx` ON `tracks` (`filePath`);--> statement-breakpoint
CREATE INDEX `tracks_album_idx` ON `tracks` (`albumId`);--> statement-breakpoint
CREATE INDEX `tracks_artist_idx` ON `tracks` (`primaryArtistId`);--> statement-breakpoint
CREATE INDEX `tracks_title_idx` ON `tracks` (`title`);--> statement-breakpoint
CREATE INDEX `tracks_album_track_idx` ON `tracks` (`albumId`,`discNumber`,`trackNumber`);--> statement-breakpoint
CREATE INDEX `tracks_artist_album_idx` ON `tracks` (`primaryArtistId`,`albumId`);