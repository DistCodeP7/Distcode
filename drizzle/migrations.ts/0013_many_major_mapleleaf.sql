ALTER TABLE "problems" ADD COLUMN "title" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "difficulty" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "test_alias" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "selected_test_path" json NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "test_build_command" text NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "test_entry_command" text NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "test_envs" json NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "submission_build_command" text NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "submission_entry_command" text NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "global_envs" json NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "replica_configs" json NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" DROP COLUMN "challenge_form";