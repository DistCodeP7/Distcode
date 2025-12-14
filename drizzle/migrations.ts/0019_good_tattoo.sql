CREATE TABLE "user_completed_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"problem_id" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"problem_id" integer NOT NULL,
	"rating" integer NOT NULL
);
--> statement-breakpoint
DROP TABLE "user_exercise_stats" CASCADE;--> statement-breakpoint
ALTER TABLE "user_completed_exercises" ADD CONSTRAINT "user_completed_exercises_user_id_users_userid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("userid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_completed_exercises" ADD CONSTRAINT "user_completed_exercises_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ratings" ADD CONSTRAINT "user_ratings_user_id_users_userid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("userid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ratings" ADD CONSTRAINT "user_ratings_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;