"use client";

import { useState } from "react";
import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useSSE } from "@/hooks/useSSE";
import type { StreamingJobResult } from "@/app/api/stream/route";
import { TerminalOutput } from "@/components/custom/TerminalOutput";
import { Button } from "@/components/ui/button";
import { BookOpen, Code } from "lucide-react";
import { submitCode } from "@/app/exercises/[id]/actions";

type ExerciseEditorProps = {
  exerciseId: number;
  userId?: number;
  problemMarkdown: string;
  templateCode: string[];
  solutionCode?: string[];
  testCasesCode?: string;
};

export default function ExerciseEditor({
  exerciseId,
  problemMarkdown,
  templateCode,
  solutionCode,
}: ExerciseEditorProps) {
  const files = templateCode.map((content, index) => ({
    name: index === 0 ? "main.go" : `file${index + 1}.go`,
    content: content,
    fileType: "go" as const,
  }));

  const [activeFile, setActiveFile] = useState(0);
  const [fileContents, setFileContents] = useState(
    files.map((file) => file.content)
  );

  const [leftPanelView, setLeftPanelView] = useState<"problem" | "solution">(
    "problem"
  );
  const [activeSolutionFile, setActiveSolutionFile] = useState(0);

  const solutionFiles = (solutionCode || []).map((content, index) => ({
    name: index === 0 ? "main.go" : `file${index + 1}.go`,
    content: content,
  }));

  const { messages, connect, clearMessages } =
    useSSE<StreamingJobResult>("/api/stream");

  const handleSolutionClick = () => {
    const shouldViewSolution = window.confirm(
      "Are you sure you want to view the solution? This will show you the complete answer to the problem."
    );

    if (shouldViewSolution) {
      setLeftPanelView("solution");
    }
  };

  const onSubmit = async () => {
    clearMessages();
    connect();

    const submissionContent = fileContents;

    try {
      const result = await submitCode(submissionContent, {
        params: { id: exerciseId },
      });
      if (result.success) {
        console.log("Code submitted successfully");
      } else {
        console.error("Submission failed:", result.error);
      }
    } catch (error) {
      console.error("Error submitting code:", error);
    }
  };

  function setEditorContent(value: React.SetStateAction<string>): void {
    setFileContents((prev) => {
      const newContents = [...prev];
      newContents[activeFile] =
        typeof value === "function" ? value(prev[activeFile]) : value;
      return newContents;
    });
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex-1 border md:min-w-[450px]"
    >
      {/* Left panel: Problem Markdown or Solution View */}
      <ResizablePanel minSize={20} className="overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Toggle buttons for left panel */}
          <div className="flex border-b bg-background">
            <Button
              variant={leftPanelView === "problem" ? "default" : "ghost"}
              size="sm"
              onClick={() => setLeftPanelView("problem")}
              className="rounded-none border-r"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Problem
            </Button>
            {solutionFiles.length > 0 && (
              <Button
                variant={leftPanelView === "solution" ? "default" : "ghost"}
                size="sm"
                onClick={handleSolutionClick}
                className="rounded-none"
              >
                <Code className="w-4 h-4 mr-2" />
                Solution
              </Button>
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {leftPanelView === "problem" ? (
              <MarkdownPreview content={problemMarkdown} />
            ) : (
              <div className="h-full flex flex-col">
                {/* Solution file tabs if multiple files */}
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

                {/* Solution editor */}
                <div className="flex-1">
                  <Editor
                    editorContent={
                      solutionFiles[activeSolutionFile]?.content || ""
                    }
                    setEditorContent={() => {}} // Read-only, no-op function
                    language="go"
                    options={{
                      readOnly: true,
                      renderLineHighlight: "none",
                      selectionHighlight: false,
                      occurrencesHighlight: "off",
                      cursorBlinking: "solid",
                      cursorStyle: "line-thin",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right panel: Editor + Terminal Output */}
      <ResizablePanel minSize={20}>
        <ResizablePanelGroup direction="vertical">
          {/* Editor panel */}
          <ResizablePanel defaultSize={50}>
            <EditorHeader
              files={files.map((file, x) => ({
                ...file,
                content: fileContents[x],
              }))}
              activeFile={activeFile}
              onFileChange={setActiveFile}
              onSubmit={onSubmit}
            />
            <Editor
              editorContent={fileContents[activeFile]}
              setEditorContent={setEditorContent}
              language={files[activeFile].fileType}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Terminal Output panel */}
          <ResizablePanel defaultSize={50}>
            <TerminalOutput messages={messages} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
