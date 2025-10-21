ALTER TABLE "submissions" ALTER COLUMN "template_code" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "template_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "solution_code" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "solution_code" DROP NOT NULL;