import { db } from "./db";
import { submissions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function submitSubmission(
  userId: number,
  title: string,
  markdown: string
) {
  const result = await db
    .insert(submissions)
    .values({ userId, title, markdown })
    .returning();

  return result[0];
}

export async function getSubmissionsByUserId(userId: number) {
  return await db
    .select()
    .from(submissions)
    .where(eq(submissions.userId, userId));
}
