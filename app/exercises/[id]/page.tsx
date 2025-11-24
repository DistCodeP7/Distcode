import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ExerciseEditor from "@/components/custom/exerciseEditor";
import { getExercise, hasUserSubmitted, loadUserRating } from "./actions";

/* ---------------- Solution Extractor ---------------- */
function extractSolutionMarkdown(codeFolder: { files: Record<string, string> }) {
  const candidates = [
    "/solution/solution.md",
    "/solution/solution.mdx",
    "/solution/solution.txt",
    "/solution/main.go",
    "/solution/index.ts",
  ];

  for (const c of candidates) {
    if (codeFolder.files[c]) return codeFolder.files[c];
  }

  const fallback = Object.entries(codeFolder.files).find(([path]) =>
      path.startsWith("/solution/")
  );

  return fallback ? fallback[1] : "";
}

/* ---------------- PAGE ---------------- */

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
  let userRating: "up" | "down" | null = null;
  let canRate = false;

  if (session?.user?.id) {
    canRate = await hasUserSubmitted({ params: { id: exerciseParams.id } });

    const rating = await loadUserRating({
      params: { id: exerciseParams.id },
    });
    if (rating === "up" || rating === "down") userRating = rating;
  }

  // ✔ Extract the solution markdown NOW
  const solutionMarkdown = extractSolutionMarkdown(exercise.codeFolder);

  return (
      <div className="h-screen flex flex-col">
        <header className="p-4 border-b">
          <h1 className="text-2xl font-bold">{exercise.title}</h1>
          <p className="text-muted-foreground">{exercise.description}</p>
        </header>

        <ExerciseEditor
            exerciseId={exerciseParams.id}
            problemMarkdown={exercise.problemMarkdown}
            solutionMarkdown={solutionMarkdown}
            codeFolder={exercise.codeFolder}
            userRating={userRating}
            canRate={canRate}
        />
      </div>
  );
}
