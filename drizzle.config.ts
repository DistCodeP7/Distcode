import "dotenv";

export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: `${process.env.DATABASE_URL}`,
  },
  verbose: true,
  strict: true,
};
