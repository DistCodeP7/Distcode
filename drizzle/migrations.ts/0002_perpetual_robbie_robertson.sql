ALTER TABLE "users" ADD COLUMN "userid" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_userid_unique" UNIQUE("userid");