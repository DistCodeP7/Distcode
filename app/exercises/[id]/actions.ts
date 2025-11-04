"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MQJobsSender } from "@/lib/mq";
import { getUserIdByEmail } from "@/lib/user";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import {attempts, submissions} from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function getExercise({ params }: { params: { id: number } }) {
  const id = Number(params.id);

  if (Number.isNaN(id)) return { error: "Invalid exercise id", status: 400 };

  const exercise = await db.query.submissions.findFirst({
    where: (sub, { eq }) => eq(sub.id, id),
  });

  if (!exercise) return { error: "Exercise not found", status: 404 };

  // If unpublished, restrict access to owner
  if (!exercise.isPublished) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return { error: "Exercise not found", status: 404 };

    const userId = await getUserIdByEmail(session.user.email);
    if (!userId || exercise.userId !== userId)
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

  const userId = await getUserIdByEmail(session.user.email);
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

export async function saveCode(
    content: string[],
    { params }: { params: { id: number } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Unauthorized", status: 401 };

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return { error: "User not found.", status: 404 };

  const submissionId = Number(params.id);
  if (Number.isNaN(submissionId))
    return { error: "Invalid submission id", status: 400 };

  const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

  if (!submission) {
    return { error: "Submission not found.", status: 404 };
  }

  await db.insert(attempts).values({
    userId,
    submissionId,
    codeSubmitted: content,
  });

  return { success: true, message: "Code saved successfully." };
}