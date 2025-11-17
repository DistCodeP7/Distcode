import { eq, sql } from "drizzle-orm";
import { problems, ratings } from "@/drizzle/schema";
import { db } from "./db";

export type ProblemWithRating = {
  id: number;
  title: string;
  description: string;
  difficulty: number;
  isPublished: boolean;
  rating: number | null;
};

export async function submitProblem(
  userId: string,
  title: string,
  description: string,
  difficulty: number,
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
      problemMarkdown,
      templateCode,
      solutionCode,
      testCasesCode,
      isPublished,
    })
    .returning();

  return result[0];
}

export async function getProblemsByUserId(
  userId: string
): Promise<ProblemWithRating[]> {
  const result = await db
    .select({
      id: problems.id,
      title: problems.title,
      description: problems.description,
      difficulty: problems.difficulty,
      isPublished: problems.isPublished,
      rating:
        sql<number>`COALESCE(SUM(CASE WHEN ${ratings.liked} THEN 1 ELSE -1 END), 0)`.as(
          "rating"
        ),
    })
    .from(problems)
    .leftJoin(ratings, eq(problems.id, ratings.problemId))
    .where(eq(problems.userId, userId))
    .groupBy(problems.id);

  return result.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    isPublished: row.isPublished,
    rating: row.rating === 0 ? null : row.rating,
  }));
}
