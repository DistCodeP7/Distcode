CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"difficulty" integer NOT NULL,
	"rating" integer NOT NULL,
	"problem_markdown" text NOT NULL,
	"template_code" text NOT NULL,
	"solution_code" text NOT NULL,
	"test_cases_code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "difficulty_check" CHECK ("submissions"."difficulty" in (1, 2, 3))
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;