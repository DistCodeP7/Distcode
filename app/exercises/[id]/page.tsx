import { notFound } from "next/navigation";
import ExerciseEditor from "@/components/custom/exerciseEditor";
import {
  getExercise,
  loadSavedCode,
  loadUserRating,
  hasUserSubmitted,
} from "./actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/user";

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

  if (session?.user?.email) {
    const userId = await getUserIdByEmail(session.user.email);
    if (userId) {
      const saved = await loadSavedCode({ params: { id: exerciseParams.id } });

      const localSaved = localStorage.getItem(
        `exercise-${exerciseParams.id}-code`
      );
      if (localSaved) {
        savedCode = JSON.parse(localSaved);
      } else if (saved?.success) savedCode = saved.code;

      canRate = await hasUserSubmitted({ params: { id: exerciseParams.id } });

      const rating = await loadUserRating({
        params: { id: exerciseParams.id },
      });
      if (rating === "up" || rating === "down") userRating = rating;
    }
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
