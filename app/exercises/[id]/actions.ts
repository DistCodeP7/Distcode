"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MQJobsSender } from "@/lib/mq";
import { getUserById } from "@/lib/user";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

export async function getExercise({ params }: { params: { id: number } }) {
  const id = Number(params.id);

  if (Number.isNaN(id)) return { error: "Invalid exercise id", status: 400 };

  const exercise = await db.query.problems.findFirst({
    where: (sub, { eq }) => eq(sub.id, id),
  });

  if (!exercise) return { error: "Exercise not found", status: 404 };

  if (!exercise.isPublished) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return { error: "Exercise not found", status: 404 };

    const user = await getUserById(session.user.id);
    if (!user || exercise.userId !== user.id)
      return { error: "Exercise not found", status: 404 };
  }

  return exercise;
}

export async function submitCode(
  content: string[],
  { params }: { params: { id: number } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Unauthorized", status: 401 };

  const userId = await getUserById(session.user.id);
  if (!userId) return { error: "User not found.", status: 404 };

  const problemId = Number(params.id);
  if (Number.isNaN(problemId))
    return { error: "Invalid exercise id", status: 400 };

  MQJobsSender.sendMessage({
    ProblemId: problemId,
    UserId: userId,
    Code: content,
    Timeoutlimit: 60,
  });

  return { success: true, message: "Code submitted successfully" };
}
