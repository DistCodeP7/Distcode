import NeonLines from "@/components/custom/NeonLine";
import ExercisesTable from "@/components/custom/exerciseTable";
import { fetchExercises } from "@/lib/fetchExercises";

export default async function ExercisesPage() {
  const exercises = await fetchExercises();

  return (
    <div className="relative w-full min-h-screen py-10">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <NeonLines count={160} />
      </div>

      <div className="container mx-auto flex flex-col gap-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-center sm:text-left text-foreground">
          Distributed Programming Exercises
        </h1>
        <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl text-center sm:text-left">
          Click on an exercise to select it.
        </p>

        <ExercisesTable exercises={exercises} />
      </div>
    </div>
  );
}
