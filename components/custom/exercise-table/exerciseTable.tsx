"use client";

import { useRouter } from "next/navigation";
import { columns } from "@/components/custom/exercise-table/columns";
import { DataTable } from "@/components/custom/exercise-table/data-table";
import type { ExerciseRow } from "@/lib/fetchExercises";

export default function ExercisesTable({
  exercises,
}: {
  exercises: ExerciseRow[];
}) {
  const router = useRouter();

  const handleSelectExercise = (id: number) => {
    const exercise = exercises.find((e) => e.id === id);
    if (exercise) {
      router.push(`/exercises/${exercise.id}`);
    }
  };

  return (
    <DataTable
      columns={columns}
      data={exercises}
      onRowClick={(row) => handleSelectExercise(row.id)}
    />
  );
}
