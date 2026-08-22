CREATE TABLE `action_events` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`set_id` text NOT NULL,
	`team_id` text NOT NULL,
	`player_id` text,
	`action_type` text NOT NULL,
	`outcome_code` text NOT NULL,
	`point_impact` text NOT NULL,
	`rally_number` integer NOT NULL,
	`sequence_in_set` integer NOT NULL,
	`our_score_after` integer NOT NULL,
	`opponent_score_after` integer NOT NULL,
	`occurred_at` text DEFAULT (current_timestamp) NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'local_only' NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`set_id`) REFERENCES `sets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`opponent_name` text NOT NULL,
	`match_date` text NOT NULL,
	`location` text,
	`format` text NOT NULL,
	`status` text DEFAULT 'setup' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`sync_status` text DEFAULT 'local_only' NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`name` text NOT NULL,
	`number` integer,
	`position` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`sync_status` text DEFAULT 'local_only' NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sets` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`our_score` integer DEFAULT 0 NOT NULL,
	`opponent_score` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`winner` text,
	`started_at` text DEFAULT (current_timestamp) NOT NULL,
	`ended_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`sync_status` text DEFAULT 'local_only' NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`sync_status` text DEFAULT 'local_only' NOT NULL
);
