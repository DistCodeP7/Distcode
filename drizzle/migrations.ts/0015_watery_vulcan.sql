CREATE TABLE "job_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"problem_id" integer NOT NULL,
	"outcome" json,
	"test_results" json,
	"duration" integer,
	"finished_at" timestamp,
	"log" jsonb
);
--> statement-breakpoint
ALTER TABLE "job_results" ADD CONSTRAINT "job_results_user_id_users_userid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("userid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_results" ADD CONSTRAINT "job_results_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;