import { eq } from "drizzle-orm";
import { problems } from "@/drizzle/schema";
import { db } from "./db";

export async function submitProblem(
  userId: number,
  title: string,
  description: string,
  difficulty: number,
  rating: number,
  problemMarkdown: string,
  templateCode: string[],
  solutionCode: string[],
  testCasesCode: string,
  isPublished = true
) {
  const result = await db
    .insert(problems)
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
      isPublished,
    })
    .returning();

  return result[0];
}

export async function getProblemsByUserId(userId: number) {
  return await db
    .select()
    .from(problems)
    .where(eq(problems.userId, userId));
}
