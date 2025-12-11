"use client";

import { BookOpen, Code } from "lucide-react";
import { useState } from "react";
import type { ProblemSolutionPanelProps } from "@/app/exercises/[id]/components/editorProps";
import { ConfirmDialog } from "@/components/custom/confirmDialog";
import MarkdownPreview from "@/components/custom/markdownPreview";
import { Button } from "@/components/ui/button";

function appendProtoToMarkdown(markdown: string, protoCode: string) {
  return `${markdown}

## Protocol Definition

\`\`\`go
${protoCode}
\`\`\`
`;
}

type Solution = {
  solutionDialog: boolean;
  solutionConfirmed: boolean;
  leftViewingFile: "problem" | "solution";
};

export function ProblemSolutionPanel({
  problemMarkdown,
  protocolCode,
  solutionMarkdown,
}: ProblemSolutionPanelProps) {
  const [solution, setSolution] = useState<Solution>({
    solutionDialog: false,
    solutionConfirmed: false,
    leftViewingFile: "problem",
  });

  const handleSolutionClick = () => {
    if (solution.solutionConfirmed) {
      setSolution((prev) => ({ ...prev, leftViewingFile: "solution" }));
    } else {
      setSolution((prev) => ({ ...prev, solutionDialog: true }));
    }
  };

  const confirmSolution = () => {
    setSolution((prev) => ({
      ...prev,
      solutionDialog: false,
      solutionConfirmed: true,
      leftViewingFile: "solution",
    }));
  };

  return (
    <>
      <ConfirmDialog
        open={solution.solutionDialog}
        onOpenChange={(value) =>
          setSolution((prev) => ({ ...prev, solutionDialog: value }))
        }
        title="View Solution?"
        description="Are you sure you want to view the solution? This will show you the complete answer to the problem."
        confirmLabel="View Solution"
        onConfirm={confirmSolution}
      />

      <div className="flex flex-col h-full">
        {/* Toggle buttons */}
        <div className="flex border-b bg-background">
          <Button
            variant={
              solution.leftViewingFile === "problem" ? "default" : "ghost"
            }
            size="sm"
            onClick={() =>
              setSolution((prev) => ({ ...prev, leftViewingFile: "problem" }))
            }
            className="rounded-none border-r"
          >
            <BookOpen className="w-4 h-4 mr-2 hover:cursor-pointer" />
            Problem
          </Button>

          {solutionMarkdown && (
            <Button
              variant={
                solution.leftViewingFile === "solution" ? "default" : "ghost"
              }
              size="sm"
              onClick={handleSolutionClick}
              className="rounded-none hover:cursor-pointer"
            >
              <Code className="w-4 h-4 mr-2" />
              Solution
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {solution.leftViewingFile === "problem" ? (
            <MarkdownPreview
              content={appendProtoToMarkdown(problemMarkdown, protocolCode)}
            />
          ) : (
            solutionMarkdown && <MarkdownPreview content={solutionMarkdown} />
          )}
        </div>
      </div>
    </>
  );
}
