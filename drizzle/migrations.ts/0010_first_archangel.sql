CREATE TABLE "userCode" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"problem_id" integer NOT NULL,
	"code_submitted" json NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "attempts" CASCADE;--> statement-breakpoint
ALTER TABLE "problems" DROP CONSTRAINT "problems_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "problems" ALTER COLUMN "user_id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "ratings" ALTER COLUMN "user_id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "userCode" ADD CONSTRAINT "userCode_user_id_users_userid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("userid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userCode" ADD CONSTRAINT "userCode_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_user_id_users_userid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("userid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_users_userid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("userid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problems" DROP COLUMN "rating";