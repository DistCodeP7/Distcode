ALTER TABLE "submissions" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "is_published" boolean DEFAULT true NOT NULL;