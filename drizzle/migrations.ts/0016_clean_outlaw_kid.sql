CREATE TABLE "log_entry" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" integer NOT NULL,
	"from" varchar NOT NULL,
	"to" varchar NOT NULL,
	"type" varchar NOT NULL,
	"vector_clock" json NOT NULL,
	"payload" varchar
);
