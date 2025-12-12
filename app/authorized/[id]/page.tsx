"use server";

import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ProblemEditorClient from "@/components/custom/problem/problemEditorClient";
import { db } from "@/lib/db";
import type { Filemap } from "@/types/actionTypes";

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || Number.isNaN(id)) return notFound();

  const exercise = await db.query.problems.findFirst({
    where: (s, { eq }) => eq(s.id, Number(id)),
  });
  if (!exercise || exercise.userId !== session.user.id) return notFound();

  const initialFilesContent: Filemap = {
    "problem.md": exercise.problemMarkdown,
  };

  function assignFilesContent(codes: Filemap | undefined, target: Filemap) {
    if (!codes) return;
    Object.entries(codes).forEach(([k, v]) => {
      target[k] = v as string;
    });
  }

  assignFilesContent(exercise.studentCode, initialFilesContent);
  assignFilesContent(
    { "solution.md": exercise.solutionMarkdown },
    initialFilesContent
  );
  assignFilesContent(exercise.testCode, initialFilesContent);
  assignFilesContent(exercise.protocolCode, initialFilesContent);

  return (
    <ProblemEditorClient
      files={initialFilesContent}
      initialFilesContent={initialFilesContent}
      problemId={exercise.id}
    />
  );
}
