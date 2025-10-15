"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/user";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ProblemEditorClient from "@/components/custom/problemEditorClient";

interface Props {
  params: { id: string };
}

export default async function EditProblemPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return notFound();

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return notFound();

  const id = Number(params.id);
  if (Number.isNaN(id)) return notFound();

  const exercise = await db.query.submissions.findFirst({
    where: (s, { eq }) => eq(s.id, id),
  });
  if (!exercise || exercise.userId !== userId) return notFound();

  const makeFiles = (prefix: string, codes: string[]) =>
    codes.map((_, i) => ({ name: `${prefix}${i === 0 ? "" : i + 1}.go`, fileType: "go" as const }));

  const files = [
    { name: "problem.md", fileType: "markdown" as const },
    ...makeFiles("template", exercise.templateCode || [""]),
    ...makeFiles("solution", exercise.solutionCode || [""]),
    { name: "testCases.go", fileType: "go" as const },
  ];

  const initialFilesContent: Record<string, string> = {
    "problem.md": exercise.problemMarkdown || "",
    "testCases.go": exercise.testCasesCode || "",
  };

  (exercise.templateCode || []).forEach((c, i) => {
    initialFilesContent[`template${i === 0 ? "" : i + 1}.go`] = c;
  });
  (exercise.solutionCode || []).forEach((c, i) => {
    initialFilesContent[`solution${i === 0 ? "" : i + 1}.go`] = c;
  });

  return (
    <ProblemEditorClient
      files={files}
      initialFilesContent={initialFilesContent}
      submissionId={exercise.id}
      initialTitle={exercise.title}
      initialDescription={exercise.description}
      initialDifficulty={String(exercise.difficulty)}
    />
  );
}
