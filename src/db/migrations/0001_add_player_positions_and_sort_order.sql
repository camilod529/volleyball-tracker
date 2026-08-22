ALTER TABLE `players` RENAME COLUMN `position` TO `positions`;
--> statement-breakpoint
ALTER TABLE `players` ADD `sort_order` integer DEFAULT 0 NOT NULL;
