"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MQJobsSender } from "@/lib/mq";
import { getUserIdByEmail } from "@/lib/user";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { notFound } from "next/dist/client/components/navigation";

export interface ExercisePageProps {
  params: { id: string };
}

export async function getExercise({ params }: ExercisePageProps) {
  const id = Number(params.id);
  if (isNaN(id)) {
    return { error: "Invalid exercise id", status: 400 };
  }

  const exercise = await db.query.submissions.findFirst({
    where: (sub, { eq }) => eq(sub.id, id),
  });

  if (!exercise) {
    return { error: "Exercise not found", status: 404 };
  }

  return exercise;
}

export async function submitCode(
  content: string,
  { params }: ExercisePageProps
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return { error: "User not found.", status: 404 };
  }

  MQJobsSender.sendMessage({
    ProblemId: params.id,
    UserId: userId,
    Code: content,
  });

  return {
    success: true,
    message: "Code submitted successfully",
  };
}
