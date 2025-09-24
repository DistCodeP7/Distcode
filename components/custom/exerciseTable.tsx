"use client";

import { columns } from "@/components/custom/columns";
import { DataTable } from "@/components/custom/data-table";
import type { ExerciseRow } from "@/lib/fetchExercises";

export default function ExercisesTable({
  exercises,
}: {
  exercises: ExerciseRow[];
}) {
  const handleSelectExercise = (id: number) => {
    const exercise = exercises.find((e) => e.id === id);
    if (exercise) alert("Selected Exercise: " + exercise.id + exercise.name); //TODO router.push to exercise page
  };

  return (
    <DataTable
      columns={columns}
      data={exercises}
      onRowClick={(row) => handleSelectExercise(row.id)}
    />
  );
}
