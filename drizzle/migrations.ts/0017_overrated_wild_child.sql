CREATE TABLE "job_process_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_uid" varchar NOT NULL,
	"event_id" varchar NOT NULL,
	"message_id" varchar NOT NULL,
	"timestamp" bigint NOT NULL,
	"from" varchar NOT NULL,
	"to" varchar NOT NULL,
	"event_type" varchar NOT NULL,
	"message_type" varchar NOT NULL,
	"vector_clock" json NOT NULL,
	"payload" text
);
--> statement-breakpoint
ALTER TABLE "log_entry" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "log_entry" CASCADE;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "timeout" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "job_process_messages" ADD CONSTRAINT "job_process_messages_job_uid_job_results_job_uid_fk" FOREIGN KEY ("job_uid") REFERENCES "public"."job_results"("job_uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_results" ADD CONSTRAINT "job_results_job_uid_unique" UNIQUE("job_uid");