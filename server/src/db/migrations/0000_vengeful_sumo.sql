CREATE TABLE `action_events` (
	`id` varchar(36) NOT NULL,
	`match_id` varchar(36) NOT NULL,
	`set_id` varchar(36) NOT NULL,
	`team_id` varchar(36) NOT NULL,
	`player_id` varchar(36),
	`action_type` varchar(32) NOT NULL,
	`outcome_code` varchar(64) NOT NULL,
	`point_impact` varchar(16) NOT NULL,
	`rally_number` int NOT NULL,
	`sequence_in_set` int NOT NULL,
	`our_score_after` int NOT NULL,
	`opponent_score_after` int NOT NULL,
	`occurred_at` varchar(32) NOT NULL,
	`notes` text,
	`created_at` varchar(32) NOT NULL,
	`updated_at` varchar(32) NOT NULL,
	`is_deleted` boolean NOT NULL DEFAULT false,
	`deleted_at` varchar(32),
	CONSTRAINT `action_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` varchar(36) NOT NULL,
	`team_id` varchar(36) NOT NULL,
	`opponent_name` varchar(255) NOT NULL,
	`match_date` varchar(32) NOT NULL,
	`location` varchar(255),
	`format` varchar(32) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'setup',
	`notes` text,
	`created_at` varchar(32) NOT NULL,
	`updated_at` varchar(32) NOT NULL,
	`is_deleted` boolean NOT NULL DEFAULT false,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` varchar(36) NOT NULL,
	`team_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`number` int,
	`positions` varchar(255) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` varchar(32) NOT NULL,
	`updated_at` varchar(32) NOT NULL,
	`is_deleted` boolean NOT NULL DEFAULT false,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sets` (
	`id` varchar(36) NOT NULL,
	`match_id` varchar(36) NOT NULL,
	`set_number` int NOT NULL,
	`our_score` int NOT NULL DEFAULT 0,
	`opponent_score` int NOT NULL DEFAULT 0,
	`status` varchar(32) NOT NULL DEFAULT 'in_progress',
	`winner` varchar(16),
	`started_at` varchar(32) NOT NULL,
	`ended_at` varchar(32),
	`created_at` varchar(32) NOT NULL,
	`updated_at` varchar(32) NOT NULL,
	`is_deleted` boolean NOT NULL DEFAULT false,
	CONSTRAINT `sets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`color` varchar(32),
	`created_at` varchar(32) NOT NULL,
	`updated_at` varchar(32) NOT NULL,
	`is_deleted` boolean NOT NULL DEFAULT false,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `action_events_updated_at_idx` ON `action_events` (`updated_at`);--> statement-breakpoint
CREATE INDEX `matches_updated_at_idx` ON `matches` (`updated_at`);--> statement-breakpoint
CREATE INDEX `players_updated_at_idx` ON `players` (`updated_at`);--> statement-breakpoint
CREATE INDEX `sets_updated_at_idx` ON `sets` (`updated_at`);--> statement-breakpoint
CREATE INDEX `teams_updated_at_idx` ON `teams` (`updated_at`);