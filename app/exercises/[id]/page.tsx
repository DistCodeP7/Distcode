import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ExerciseEditor from "@/components/custom/exerciseEditor";
import {
  getExercise,
  hasUserSubmitted,
  loadSavedCode,
  loadUserRating,
} from "./actions";

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
  let savedCode: string[] | null = null;
  let userRating: "up" | "down" | null = null;
  let canRate = false;

  if (session?.user?.id) {
    const saved = await loadSavedCode({ params: { id: exerciseParams.id } });
    if (saved?.success) savedCode = saved.code;

    canRate = await hasUserSubmitted({ params: { id: exerciseParams.id } });

    const rating = await loadUserRating({
      params: { id: exerciseParams.id },
    });
    if (rating === "up" || rating === "down") userRating = rating;
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">{exercise.title}</h1>
        <p className="text-muted-foreground">{exercise.description}</p>
      </header>

      <ExerciseEditor
        exerciseId={exerciseParams.id}
        problemMarkdown={exercise.problemMarkdown}
        templateCode={exercise.templateCode}
        solutionCode={exercise.solutionCode}
        testCasesCode={exercise.testCasesCode}
        savedCode={savedCode}
        userRating={userRating}
        canRate={canRate}
      />
    </div>
  );
}
