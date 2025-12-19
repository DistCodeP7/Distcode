import ExercisesTable from "@/components/custom/exercise-table/exerciseTable";
import NeonLines from "@/components/custom/neonLine";
import { fetchExercises } from "@/lib/fetchExercises";

export default async function ExercisesPage() {
  const exercises = (await fetchExercises()) ?? [];
  return (
    <div className="relative w-full py-10">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <NeonLines />
      </div>

      <div className="container mx-auto flex flex-col gap-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-center sm:text-left text-foreground">
          Distributed Programming Exercises
        </h1>
        <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl text-center sm:text-left">
          Click on an exercise to select it.
        </p>

        {exercises.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <h2 className="text-2xl font-semibold">No exercises yet</h2>
            <p className="text-muted-foreground mt-2">
              There are currently no published exercises.
            </p>
          </div>
        ) : (
          <ExercisesTable exercises={exercises} />
        )}
      </div>
    </div>
  );
}
