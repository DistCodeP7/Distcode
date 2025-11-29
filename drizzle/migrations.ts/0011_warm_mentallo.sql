ALTER TABLE "problems" ALTER COLUMN "solution_code" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "problems" ALTER COLUMN "test_cases_code" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "protocol_code" text NOT NULL;