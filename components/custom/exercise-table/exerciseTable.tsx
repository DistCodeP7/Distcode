"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { columns } from "@/components/custom/exercise-table/columns";
import { DataTable } from "@/components/custom/exercise-table/dataTable";
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

  const session = useSession();

  const completedRows = exercises
    .filter(
      (exercises) =>
        exercises.userId?.includes(session.data?.user.id ?? "") &&
        exercises.isCompleted
    )
    .map((exercise) => exercise.id);

  return (
    <DataTable
      columns={columns}
      data={exercises}
      onRowClick={(row) => handleSelectExercise(row.id)}
      completedRows={completedRows}
    />
  );
}
