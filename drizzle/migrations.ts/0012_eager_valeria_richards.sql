ALTER TABLE "problems" ADD COLUMN "test_code" json NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" DROP COLUMN "test_cases_code";