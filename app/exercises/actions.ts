"use server";

import { and, eq } from "drizzle-orm";
import { user_exercise_stats } from "@/drizzle/schema";
import { db } from "@/lib/db";

export async function saveUserExerciseStat(
  exerciseId: number,
  label: string,
  userid: string
) {
  console.log(
    "Saving stat for user:",
    userid,
    "exerciseId:",
    exerciseId,
    "label:",
    label
  );

  const existing = await db
    .select()
    .from(user_exercise_stats)
    .where(
      and(
        eq(user_exercise_stats.userId, userid),
        eq(user_exercise_stats.problemId, exerciseId)
      )
    );

  if (existing.length > 0) {
    if (label === "Passed") {
      await db
        .update(user_exercise_stats)
        .set({
          isCompleted: true,
          completedAt: new Date(),
        })
        .where(
          and(
            eq(user_exercise_stats.userId, userid),
            eq(user_exercise_stats.problemId, exerciseId)
          )
        );
    }
  } else {
    if (label === "Passed") {
      await db.insert(user_exercise_stats).values({
        userId: userid,
        problemId: exerciseId,
        isCompleted: true,
        completedAt: new Date(),
      });
    } else {
      await db.insert(user_exercise_stats).values({
        userId: userid,
        problemId: exerciseId,
      });
    }
  }
}
