"use server";

import { and, eq } from "drizzle-orm";
import { user_completed_exercises } from "@/drizzle/schema";
import { db } from "@/lib/db";

export async function saveCompletedExercises(
  exerciseId: number,
  label: string,
  userid: string
) {
  const existingUserStats = await db
    .select()
    .from(user_completed_exercises)
    .where(
      and(
        eq(user_completed_exercises.userId, userid),
        eq(user_completed_exercises.problemId, exerciseId)
      )
    );

  if (existingUserStats.length > 0) {
    if (label === "Passed") {
      await db
        .update(user_completed_exercises)
        .set({
          isCompleted: true,
          completedAt: new Date(),
        })
        .where(
          and(
            eq(user_completed_exercises.userId, userid),
            eq(user_completed_exercises.problemId, exerciseId)
          )
        );
    }
  } else {
    if (label === "Passed") {
      await db.insert(user_completed_exercises).values({
        userId: userid,
        problemId: exerciseId,
        isCompleted: true,
        completedAt: new Date(),
      });
    } else {
      await db.insert(user_completed_exercises).values({
        userId: userid,
        problemId: exerciseId,
      });
    }
  }
}
