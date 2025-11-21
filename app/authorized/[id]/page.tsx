"use server";

import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ProblemEditorClient from "@/components/custom/problemEditorClient";
import { db } from "@/lib/db";
import { nodeSpec } from "@/drizzle/schema";

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

  // Helper to extract file names from codeFolder.files Map
  function getFilesFromCodeFolder(codeFolder: nodeSpec) {
    const files: { name: string; fileType: "go" | "markdown" }[] = [];
    for (const [name, _] of codeFolder.files.entries()) {
      if (name.endsWith(".go")) {
        files.push({ name, fileType: "go" });
      } else if (name.endsWith(".md")) {
        files.push({ name, fileType: "markdown" });
      }
    }
    return files;
  }

  const files = getFilesFromCodeFolder(exercise.codeFolder);

  return (
    <ProblemEditorClient
      files={files}
      initialFilesContent={exercise.codeFolder.files}
      problemId={exercise.id}
      initialTitle={exercise.title}
      initialDescription={exercise.description}
      initialDifficulty={String(exercise.difficulty)}
    />
  );
}
