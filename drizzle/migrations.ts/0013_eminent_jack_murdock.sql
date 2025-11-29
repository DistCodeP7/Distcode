ALTER TABLE "problems" ADD COLUMN "student_code" json NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" DROP COLUMN "template_code";