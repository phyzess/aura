CREATE TABLE `alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`level` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`device_info` text,
	`metrics` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `alerts_userId_idx` ON `alerts` (`user_id`);--> statement-breakpoint
CREATE INDEX `alerts_level_idx` ON `alerts` (`level`);--> statement-breakpoint
CREATE INDEX `alerts_type_idx` ON `alerts` (`type`);--> statement-breakpoint
CREATE INDEX `alerts_createdAt_idx` ON `alerts` (`created_at`);--> statement-breakpoint
CREATE TABLE `sync_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`workspaces_input` integer NOT NULL,
	`collections_input` integer NOT NULL,
	`tabs_input` integer NOT NULL,
	`workspaces_updated` integer NOT NULL,
	`workspaces_skipped` integer NOT NULL,
	`collections_updated` integer NOT NULL,
	`collections_skipped` integer NOT NULL,
	`tabs_updated` integer NOT NULL,
	`tabs_skipped` integer NOT NULL,
	`duration` integer NOT NULL,
	`db_operations` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `sync_metrics_userId_idx` ON `sync_metrics` (`user_id`);--> statement-breakpoint
CREATE INDEX `sync_metrics_createdAt_idx` ON `sync_metrics` (`created_at`);