import { notFound } from "next/navigation";
import ExerciseEditor from "@/components/custom/exerciseEditor";
import { getExercise } from "./actions";

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
      />
    </div>
  );
}
