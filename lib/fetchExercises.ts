import { problems, ratings } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export type ExerciseRow = {
    id: number;
    rating: number | null;
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
            isPublished: problems.isPublished,
            rating: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${ratings.liked} IS TRUE THEN 1
                WHEN ${ratings.liked} IS FALSE THEN -1
                ELSE 0
              END
            ), 
            0
          )
        `.as("rating"),
        })
        .from(problems)
        .leftJoin(ratings, eq(problems.id, ratings.problemId))
        .where(eq(problems.isPublished, true))
        .groupBy(problems.id);

    return dbExercises.map((ex) => ({
        id: ex.id,
        rating: ex.rating === 0 ? null : ex.rating,
        name: ex.name,
        description: ex.description,
        difficulty: difficultyMap[ex.difficulty as 1 | 2 | 3],
    }));
}
