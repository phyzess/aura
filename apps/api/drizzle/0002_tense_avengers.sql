ALTER TABLE `collections` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `tabs` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `deleted_at` integer;