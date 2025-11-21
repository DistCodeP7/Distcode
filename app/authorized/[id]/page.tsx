"use server";

import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ProblemEditorClient from "@/components/custom/problemEditorClient";
import { db } from "@/lib/db";

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return notFound();

  if (Number.isNaN(id)) return notFound();

  const exercise = await db.query.problems.findFirst({
    where: (s, { eq }) => eq(s.id, Number(id)),
  });
  if (!exercise || exercise.userId !== session.user.id) return notFound();

  return (
    <ProblemEditorClient
      files={exercise.codeFolder.files}
      initialFilesContent={exercise.codeFolder.files}
      problemId={exercise.id}
      initialTitle={exercise.title}
      initialDescription={exercise.description}
      initialDifficulty={String(exercise.difficulty)}
    />
  );
}
