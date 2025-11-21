ALTER TABLE "problems" ADD COLUMN "codefolder" json NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" DROP COLUMN "template_code";--> statement-breakpoint
ALTER TABLE "problems" DROP COLUMN "solution_code";--> statement-breakpoint
ALTER TABLE "problems" DROP COLUMN "test_cases_code";