import { notFound } from "next/navigation";
import ExerciseEditor from "@/components/custom/exerciseEditor";
import { getExercise } from "./actions";

interface ExercisePageProps {
  params: { id: string };
}

export default async function ExercisePage({ params }: ExercisePageProps) {
  const exercise = await getExercise({ params });

  if (!exercise || "error" in exercise) {
    return notFound();
  }

  const { id } = params;

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">{exercise.title}</h1>
        <p className="text-muted-foreground">{exercise.description}</p>
      </header>

      <ExerciseEditor
        exerciseId={id}
        problemMarkdown={exercise.problemMarkdown}
        templateCode={exercise.templateCode || []}
        solutionCode={exercise.solutionCode || []}
        testCasesCode={exercise.testCasesCode}
      />
    </div>
  );
}
