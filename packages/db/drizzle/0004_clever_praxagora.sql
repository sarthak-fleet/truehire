CREATE TABLE `candidate_evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`pipeline_candidate_id` text NOT NULL,
	`stage` text NOT NULL,
	`scores_json` text DEFAULT '{}' NOT NULL,
	`overall_recommendation` text,
	`evaluator_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`pipeline_candidate_id`) REFERENCES `pipeline_candidates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`evaluator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hiring_pipelines` (
	`id` text PRIMARY KEY NOT NULL,
	`role_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `hiring_roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `hiring_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`requirements_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pipeline_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`pipeline_id` text NOT NULL,
	`user_id` text NOT NULL,
	`stage` text DEFAULT 'shortlist' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`pipeline_id`) REFERENCES `hiring_pipelines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
