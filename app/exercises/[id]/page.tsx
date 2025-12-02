import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ExerciseEditor from "@/components/custom/exerciseEditor";
import type { Paths } from "@/drizzle/schema";
import { getExercise, loadSavedCode } from "./actions";

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const exerciseParams = await params;
  const exercise = await getExercise({ params: exerciseParams });

  if (!exercise || "error" in exercise) {
    return notFound();
  }

  const session = await getServerSession(authOptions);
  let savedCode: Paths | null = null;

  if (session?.user?.id) {
    const saved = await loadSavedCode({ params: { id: exerciseParams.id } });
    if (saved?.success) savedCode = saved.code;
  }

  return (
    <div className="h-full flex flex-col overflow-x-hidden">
      <ExerciseEditor
        exerciseId={exerciseParams.id}
        problemMarkdown={exercise.problemMarkdown}
        studentCode={exercise.studentCode}
        solutionCode={exercise.solutionCode}
        testCasesCode={exercise.testCode}
        protocalCode={exercise.protocolCode}
        savedCode={savedCode}
      />
    </div>
  );
}
