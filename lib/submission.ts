import { eq } from "drizzle-orm";
import { submissions } from "@/drizzle/schema";
import { db } from "./db";

export async function submitSubmission(
  userId: number,
  title: string,
  description: string,
  difficulty: number,
  rating: number,
  problemMarkdown: string,
  templateCode: string,
  solutionCode: string,
  testCasesCode: string
) {
  const result = await db
    .insert(submissions)
    .values({
      userId,
      title,
      description,
      difficulty,
      rating,
      problemMarkdown,
      templateCode,
      solutionCode,
      testCasesCode,
    })
    .returning();

  return result[0];
}

export async function getSubmissionsByUserId(userId: number) {
  return await db
    .select()
    .from(submissions)
    .where(eq(submissions.userId, userId));
}
