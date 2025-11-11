ALTER TABLE "submissions" RENAME TO "problems";--> statement-breakpoint
ALTER TABLE "problems" DROP CONSTRAINT "difficulty_check";--> statement-breakpoint
ALTER TABLE "problems" DROP CONSTRAINT "submissions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "difficulty_check" CHECK ("problems"."difficulty" in (1, 2, 3));