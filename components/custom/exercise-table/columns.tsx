"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CircleCheck, CircleX } from "lucide-react";
import type { Difficulty } from "@/types/challenge";

export type exercises = {
  id: number;
  name: string;
  description: string;
  difficulty: Difficulty;
  rating: number;
  isCompleted: boolean;
};

export const columns: ColumnDef<exercises>[] = [
  {
    accessorKey: "name",
    size: 200,
    header: "Name",
    cell: ({ row }) => (
      <div className="font-medium break-words whitespace-normal text-left">
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "description",
    size: 400,
    header: "Description",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="italic text-gray-500 break-words whitespace-normal text-left">
        {row.getValue("description")}
      </div>
    ),
  },
  {
    accessorKey: "difficulty",
    size: 120,
    header: "Difficulty",
    sortingFn: (rowA, rowB, columnId) => {
      const order: Record<Difficulty, number> = {
        Easy: 1,
        Medium: 2,
        Hard: 3,
      };
      const a = rowA.getValue(columnId) as Difficulty;
      const b = rowB.getValue(columnId) as Difficulty;
      return order[a] - order[b];
    },
    cell: ({ row }) => {
      const value = row.getValue("difficulty") as Difficulty;
      const difficultyColors: Record<Difficulty, string> = {
        Easy: "text-chart-2",
        Medium: "text-chart-3",
        Hard: "text-primary",
      };
      return (
        <div className={`font-semibold text-left ${difficultyColors[value]}`}>
          {value}
        </div>
      );
    },
  },
  {
    accessorKey: "rating",
    size: 100,
    header: "Rating",
    cell: ({ row }) => (
      <div className="font-medium text-left">
        {(row.getValue("rating") as number).toFixed(0)}
      </div>
    ),
  },
  {
    accessorKey: "isCompleted",
    size: 100,
    header: "Completed",
    cell: ({ row }) => {
      const rowValue = row.getValue("isCompleted") as boolean;
      return (
        <div className="font-medium text-left">
          {rowValue ? (
            <CircleCheck className="w-4 h-4 text-green-500" />
          ) : (
            <CircleX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </div>
      );
    },
  },
];
