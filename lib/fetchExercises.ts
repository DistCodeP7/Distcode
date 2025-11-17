import { eq } from "drizzle-orm";
import { problems, ratings } from "@/drizzle/schema";
import { db } from "@/lib/db";

export type ExerciseRow = {
  id: number;
  rating: number;
  name: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

const difficultyMap = { 1: "Easy", 2: "Medium", 3: "Hard" } as const;

export async function fetchExercises(): Promise<ExerciseRow[]> {
  const dbExercises = await db
    .select({
      id: problems.id,
      name: problems.title,
      description: problems.description,
      difficulty: problems.difficulty,
    })
    .from(problems)
    .leftJoin(ratings, eq(ratings.problemId, problems.id))
    .where(eq(problems.isPublished, true))
    .groupBy(problems.id);

  const exerciseRows = dbExercises.map(async (ex) => {
    const sum = await db
      .select({ liked: ratings.liked })
      .from(ratings)
      .where(eq(ratings.problemId, ex.id));
    const rating = sum.reduce((acc, curr) => acc + (curr.liked ? 1 : -1), 0);
    return {
      id: ex.id,
      rating,
      name: ex.name,
      description: ex.description,
      difficulty: difficultyMap[ex.difficulty as 1 | 2 | 3],
    };
  });

  return await Promise.all(exerciseRows);
}
