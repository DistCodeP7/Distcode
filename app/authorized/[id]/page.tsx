"use server";

import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ProblemEditorClient from "@/components/custom/problemEditorClient";
import type { Paths } from "@/drizzle/schema";
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

  const initialFilesContent: Paths = {
    "problem.md": exercise.problemMarkdown,
  };

  function assignFilesContent(codes: Paths | undefined, target: Paths) {
    if (!codes) return;
    Object.entries(codes).forEach(([k, v]) => {
      target[k] = v as string;
    });
  }

  assignFilesContent(exercise.studentCode, initialFilesContent);
  if (exercise.solutionCode)
    initialFilesContent["solution.md"] = exercise.solutionCode;
  assignFilesContent(exercise.testCode, initialFilesContent);

  return (
    <ProblemEditorClient
      files={initialFilesContent}
      initialFilesContent={initialFilesContent}
      problemId={exercise.id}
      initialTitle={exercise.title}
      initialDescription={exercise.description}
      initialDifficulty={String(exercise.difficulty)}
    />
  );
}
