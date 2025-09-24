import { submissions } from "@/drizzle/schema";
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
      id: submissions.id,
      rating: submissions.rating,
      name: submissions.title,
      description: submissions.description,
      difficulty: submissions.difficulty,
    })
    .from(submissions);

  return dbExercises.map((ex) => ({
    id: ex.id,
    rating: ex.rating,
    name: ex.name,
    description: ex.description,
    difficulty: difficultyMap[ex.difficulty as 1 | 2 | 3],
  }));
}
