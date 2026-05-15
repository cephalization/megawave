CREATE TABLE `track_art` (
	`id` integer PRIMARY KEY NOT NULL,
	`trackId` integer NOT NULL,
	`mime` text NOT NULL,
	`data` blob NOT NULL,
	`description` text,
	`width` integer,
	`height` integer,
	FOREIGN KEY (`trackId`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `track_art_track_idx` ON `track_art` (`trackId`);--> statement-breakpoint
ALTER TABLE `scan_sessions` ADD `tracksMissing` integer;--> statement-breakpoint
ALTER TABLE `scan_sessions` ADD `tracksErrored` integer;--> statement-breakpoint
ALTER TABLE `scan_sessions` ADD `lastError` text;--> statement-breakpoint
ALTER TABLE `tracks` ADD `status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE INDEX `tracks_status_idx` ON `tracks` (`status`);