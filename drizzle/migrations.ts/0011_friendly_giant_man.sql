ALTER TABLE "problems" ALTER COLUMN "solution_code" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "student_code" json NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "protocol_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "test_code" json NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "challenge_form" json NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" DROP COLUMN "template_code";--> statement-breakpoint
ALTER TABLE "problems" DROP COLUMN "test_cases_code";