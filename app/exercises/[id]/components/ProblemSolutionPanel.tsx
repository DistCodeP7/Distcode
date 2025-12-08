"use client";

import { BookOpen, Code } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/custom/confirmDialog";
import MarkdownPreview from "@/components/custom/markdown-preview";
import { Button } from "@/components/ui/button";

type SolutionFile = {
  name: string;
  content: string;
};

type ProblemSolutionPanelProps = {
  problemMarkdown: string;
  protocolCode: string;
  solutionFiles: SolutionFile[];
};

function appendProtoToMarkdown(markdown: string, protoCode: string) {
  return `${markdown}

## Protocol Definition

\`\`\`go
${protoCode}
\`\`\`
`;
}

export function ProblemSolutionPanel({
  problemMarkdown,
  protocolCode,
  solutionFiles,
}: ProblemSolutionPanelProps) {
  const [leftPanelView, setLeftPanelView] = useState<"problem" | "solution">(
    "problem"
  );
  const [activeSolutionFile, setActiveSolutionFile] = useState(0);
  const [showSolutionDialog, setShowSolutionDialog] = useState(false);
  const [solutionDialogConfirmed, setSolutionDialogConfirmed] = useState(false);

  const handleSolutionClick = () => {
    if (solutionDialogConfirmed) {
      setLeftPanelView("solution");
    } else {
      setShowSolutionDialog(true);
    }
  };

  const confirmSolution = () => {
    setSolutionDialogConfirmed(true);
    setShowSolutionDialog(false);
    setLeftPanelView("solution");
  };

  return (
    <>
      <ConfirmDialog
        open={showSolutionDialog}
        onOpenChange={setShowSolutionDialog}
        title="View Solution?"
        description="Are you sure you want to view the solution? This will show you the complete answer to the problem."
        confirmLabel="View Solution"
        onConfirm={confirmSolution}
      />

      <div className="flex flex-col h-full">
        {/* Toggle buttons */}
        <div className="flex border-b bg-background">
          <Button
            variant={leftPanelView === "problem" ? "default" : "ghost"}
            size="sm"
            onClick={() => setLeftPanelView("problem")}
            className="rounded-none border-r"
          >
            <BookOpen className="w-4 h-4 mr-2 hover:cursor-pointer" />
            Problem
          </Button>

          {solutionFiles.length > 0 && (
            <Button
              variant={leftPanelView === "solution" ? "default" : "ghost"}
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
          {leftPanelView === "problem" ? (
            <MarkdownPreview
              content={appendProtoToMarkdown(problemMarkdown, protocolCode)}
            />
          ) : (
            <div className="h-full flex flex-col">
              {solutionFiles.length > 1 && (
                <div className="flex border-b bg-muted">
                  {solutionFiles.map((file, index) => (
                    <Button
                      key={file.name}
                      variant={
                        activeSolutionFile === index ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => setActiveSolutionFile(index)}
                      className="rounded-none border-r"
                    >
                      {file.name}
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex-1">
                <MarkdownPreview
                  content={solutionFiles[activeSolutionFile]?.content || ""}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
