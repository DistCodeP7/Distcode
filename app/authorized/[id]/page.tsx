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

  const makeFiles = (prefix: string, codes: string[]) =>
    codes.map((_, i) => ({
      name: `${prefix}${i === 0 ? "" : i + 1}.go`,
      fileType: "go" as const,
    }));

  const files = [
    { name: "problem.md", fileType: "markdown" as const },
    ...makeFiles("/student/main.go", exercise.studentCode),
    // single solution file
    ...(exercise.solutionCode
      ? [{ name: "solution.go", fileType: "go" as const }]
      : []),
    ...makeFiles("/test/test.go", exercise.testCode || []),
  ];

  const initialFilesContent: Record<string, string> = {
    "problem.md": exercise.problemMarkdown,
  };

  function assignFilesContent(
    prefix: string,
    codes: string[],
    target: Record<string, string>
  ) {
    codes.forEach((code, i) => {
      target[`${prefix}${i === 0 ? "" : i + 1}.go`] = code;
    });
  }

  assignFilesContent(
    "/student/main.go",
    exercise.studentCode,
    initialFilesContent
  );
  if (exercise.solutionCode)
    initialFilesContent["solution.go"] = exercise.solutionCode;
  assignFilesContent(
    "/test/test.go",
    exercise.testCode || [],
    initialFilesContent
  );

  return (
    <ProblemEditorClient
      files={files}
      initialFilesContent={initialFilesContent}
      problemId={exercise.id}
      initialTitle={exercise.title}
      initialDescription={exercise.description}
      initialDifficulty={String(exercise.difficulty)}
    />
  );
}
