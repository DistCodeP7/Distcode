ALTER TABLE "job_results" ADD COLUMN "time_reserving" bigint;--> statement-breakpoint
ALTER TABLE "job_results" ADD COLUMN "time_compiling" bigint;--> statement-breakpoint
ALTER TABLE "job_results" ADD COLUMN "time_running" bigint;--> statement-breakpoint
ALTER TABLE "job_results" ADD COLUMN "time_pending" bigint;--> statement-breakpoint
ALTER TABLE "job_results" ADD COLUMN "time_configuring_network" bigint;--> statement-breakpoint
ALTER TABLE "job_results" ADD COLUMN "time_completed" bigint;