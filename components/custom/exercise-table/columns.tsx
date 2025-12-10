"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import type { Difficulty } from "@/app/authorized/checkout/challenge";
import { Button } from "@/components/ui/button";

export type exercises = {
  id: number;
  name: string;
  description: string;
  difficulty: Difficulty;
};
export const columns: ColumnDef<exercises>[] = [
  {
    accessorKey: "name",
    size: 200,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center space-x-1"
      >
        <span>Name</span>
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium break-words whitespace-normal">
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
      <div className="italic text-gray-500 break-words whitespace-normal">
        {row.getValue("description")}
      </div>
    ),
  },
  {
    accessorKey: "difficulty",
    size: 120,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center justify-center"
      >
        <span>Difficulty</span>
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
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
        <div className={`font-semibold text-center ${difficultyColors[value]}`}>
          {value}
        </div>
      );
    },
  },
];
