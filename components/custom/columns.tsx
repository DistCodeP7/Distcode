"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type exercises = {
  rating: number;
  id: number;
  name: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
};
export const columns: ColumnDef<exercises>[] = [
  {
    accessorKey: "rating",
    size: 80,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        className="flex items-center justify-center"
      >
        <span>Rating</span>
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.getValue("rating")}</div>
    ),
  },
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
      const order: Record<"Easy" | "Medium" | "Hard", number> = {
        Easy: 1,
        Medium: 2,
        Hard: 3,
      };
      const a = rowA.getValue(columnId) as "Easy" | "Medium" | "Hard";
      const b = rowB.getValue(columnId) as "Easy" | "Medium" | "Hard";
      return order[a] - order[b];
    },
    cell: ({ row }) => {
      const value = row.getValue("difficulty") as "Easy" | "Medium" | "Hard";
      const difficultyColors: Record<typeof value, string> = {
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
