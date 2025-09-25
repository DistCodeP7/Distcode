"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/custom/data-table";
import { ExerciseRow } from "@/lib/fetchExercises";
import { columns } from "@/components/custom/columns";

export default function ExercisesTable({ exercises }: { exercises: ExerciseRow[] }) {
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
