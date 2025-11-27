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

/* ---------------- Solution Extractor ---------------- */
function extractSolutionMarkdown(codeFolder: {
  Files: Record<string, string>;
}) {
  const candidates = [
    "/solution/solution.md",
    "/solution/solution.mdx",
    "/solution/solution.txt",
    "/solution/index.ts",
  ];

  for (const c of candidates) {
    if (codeFolder.Files[c]) return codeFolder.Files[c];
  }

  const fallback = Object.entries(codeFolder.Files).find(([path]) =>
    path.startsWith("/solution/")
  );

  return fallback ? fallback[1] : "";
}

/* ---------------- PAGE ---------------- */
export default async function ExercisePage({
  params,
}: {
  params: { id: string };
}) {
  const exerciseId = Number(params.id);
  if (Number.isNaN(exerciseId)) return notFound();

  const exercise = await getExercise({ params: { id: exerciseId } });
  if (!exercise || "error" in exercise) return notFound();

  const session = await getServerSession(authOptions);

  let userRating: "up" | "down" | null = null;
  let canRate = false;
  let savedCode: typeof exercise.codeFolder | undefined;

  if (session?.user?.id) {
    canRate = await hasUserSubmitted({ params: { id: exerciseId } });

    const rating = await loadUserRating({ params: { id: exerciseId } });
    if (rating === "up" || rating === "down") userRating = rating;

    const savedResult = await loadSavedCode({ params: { id: exerciseId } });
    if (savedResult?.success && savedResult.code) {
      savedCode = savedResult.code;
    }
  }

  const solutionMarkdown = extractSolutionMarkdown({
    Files: exercise.codeFolder.Files,
  });

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">{exercise.title}</h1>
        <p className="text-muted-foreground">{exercise.description}</p>
      </header>

      <ExerciseEditor
        exerciseId={exerciseId}
        problemMarkdown={exercise.problemMarkdown}
        solutionMarkdown={solutionMarkdown}
        codeFolder={exercise.codeFolder}
        savedCode={savedCode}
        userRating={userRating}
        canRate={canRate}
      />
    </div>
  );
}
