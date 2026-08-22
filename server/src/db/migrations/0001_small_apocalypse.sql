DROP INDEX `action_events_updated_at_idx` ON `action_events`;--> statement-breakpoint
DROP INDEX `matches_updated_at_idx` ON `matches`;--> statement-breakpoint
DROP INDEX `players_updated_at_idx` ON `players`;--> statement-breakpoint
DROP INDEX `sets_updated_at_idx` ON `sets`;--> statement-breakpoint
DROP INDEX `teams_updated_at_idx` ON `teams`;--> statement-breakpoint
ALTER TABLE `action_events` ADD `synced_at` varchar(32);--> statement-breakpoint
ALTER TABLE `matches` ADD `synced_at` varchar(32);--> statement-breakpoint
ALTER TABLE `players` ADD `synced_at` varchar(32);--> statement-breakpoint
ALTER TABLE `sets` ADD `synced_at` varchar(32);--> statement-breakpoint
ALTER TABLE `teams` ADD `synced_at` varchar(32);--> statement-breakpoint
UPDATE `action_events` SET `synced_at` = `updated_at` WHERE `synced_at` IS NULL;--> statement-breakpoint
UPDATE `matches` SET `synced_at` = `updated_at` WHERE `synced_at` IS NULL;--> statement-breakpoint
UPDATE `players` SET `synced_at` = `updated_at` WHERE `synced_at` IS NULL;--> statement-breakpoint
UPDATE `sets` SET `synced_at` = `updated_at` WHERE `synced_at` IS NULL;--> statement-breakpoint
UPDATE `teams` SET `synced_at` = `updated_at` WHERE `synced_at` IS NULL;--> statement-breakpoint
ALTER TABLE `action_events` MODIFY `synced_at` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `matches` MODIFY `synced_at` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `players` MODIFY `synced_at` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `sets` MODIFY `synced_at` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `teams` MODIFY `synced_at` varchar(32) NOT NULL;--> statement-breakpoint
CREATE INDEX `action_events_synced_at_idx` ON `action_events` (`synced_at`);--> statement-breakpoint
CREATE INDEX `matches_synced_at_idx` ON `matches` (`synced_at`);--> statement-breakpoint
CREATE INDEX `players_synced_at_idx` ON `players` (`synced_at`);--> statement-breakpoint
CREATE INDEX `sets_synced_at_idx` ON `sets` (`synced_at`);--> statement-breakpoint
CREATE INDEX `teams_synced_at_idx` ON `teams` (`synced_at`);
