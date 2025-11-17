import { eq } from "drizzle-orm";
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
    })
    .from(problems)
    .leftJoin(ratings, eq(problems.id, ratings.problemId))
    .where(eq(problems.userId, userId))
    .groupBy(problems.id);

  const problemRows = result.map(async (ex) => {
    const sum = await db
      .select({ liked: ratings.liked })
      .from(ratings)
      .where(eq(ratings.problemId, ex.id));
    const rating = sum.reduce((acc, curr) => acc + (curr.liked ? 1 : -1), 0);
    return {
      isPublished: ex.isPublished,
      id: ex.id,
      title: ex.title,
      description: ex.description,
      rating,
      difficulty: ex.difficulty,
    };
  });

  return await Promise.all(problemRows);
}
