import { problems } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

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
      rating: problems.rating,
      name: problems.title,
      description: problems.description,
      difficulty: problems.difficulty,
    })
    .from(problems)
    .where(eq(problems.isPublished, true));

  if (!dbExercises) return [];

  return dbExercises.map((ex) => ({
    id: ex.id,
    rating: ex.rating,
    name: ex.name,
    description: ex.description,
    difficulty: difficultyMap[ex.difficulty as 1 | 2 | 3],
  }));
}
