"use client";

import { useState } from "react";
import { DataTable } from "@/components/custom/data-table";
import { columns, exercises } from "@/components/custom/columns";
import NeonLines from "@/components/custom/NeonLine";

const data: exercises[] = [
  {
    rating: 65,
    id: 1,
    name: "Leader Election",
    description:
      "Design an algorithm to elect a leader in a distributed system with unreliable nodes.",
    difficulty: "Easy",
  },
  {
    rating: 80,
    id: 2,
    name: "Distributed Lock",
    description:
      "Implement a distributed lock service that ensures mutual exclusion across multiple servers.",
    difficulty: "Medium",
  },
  {
    rating: 43,
    id: 3,
    name: "Consensus Protocol",
    description:
      "Describe and implement a consensus protocol to agree on a value among distributed nodes.",
    difficulty: "Easy",
  },
  {
    rating: 55,
    id: 4,
    name: "Vector Clocks",
    description:
      "Implement vector clocks to track causal relationships between events in a distributed system.",
    difficulty: "Medium",
  },
  {
    rating: 70,
    id: 5,
    name: "Gossip Protocol",
    description:
      "Simulate a gossip protocol for disseminating information reliably across nodes.",
    difficulty: "Hard",
  },
  {
    rating: 90,
    id: 6,
    name: "Paxos Algorithm",
    description:
      "Implement the Paxos consensus algorithm for agreeing on a single value across distributed nodes.",
    difficulty: "Hard",
  },
];

export default function ExercisesPage() {
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);

  const handleSelectExercise = (id: number) => {
    const exercise = data.find((e) => e.id === id);
    if (!exercise) return;

    setSelectedExercise(exercise.id);
    alert("Selected Exercise: " + exercise.name);
  };

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

        <DataTable
          columns={columns}
          data={data}
          selectedRows={selectedExercise ? [selectedExercise] : []}
          onRowClick={(row) => handleSelectExercise(row.id)}
        />
      </div>
    </div>
  );
}
