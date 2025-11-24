"use client";

import { BookOpen, Code, ThumbsDown, ThumbsUp } from "lucide-react";
import type React from "react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import type { StreamingJobResult } from "@/app/api/stream/route";
import {
  rateExercise,
  resetCode,
  saveCode,
  submitCode,
} from "@/app/exercises/[id]/actions";
import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import { TerminalOutput } from "@/components/custom/TerminalOutput";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { nodeSpec } from "@/drizzle/schema";
import { useSSE } from "@/hooks/useSSE";
import { type FileNode } from "./problemEditorClient";

type ExerciseEditorProps = {
  exerciseId: number;
  problemMarkdown: string;
  codeFolder: nodeSpec;
  userRating?: "up" | "down" | null;
  canRate?: boolean;
};

export default function ExerciseEditor({
                                         exerciseId,
                                         problemMarkdown,
                                         codeFolder,
                                         userRating: initialUserRating = null,
                                         canRate: initialCanRate = false,
                                       }: ExerciseEditorProps) {
  const [activeFile, setActiveFile] = useState(0);
  const [leftPanelView, setLeftPanelView] = useState<"problem" | "solution">(
      "problem"
  );
  const [activeSolutionFile, setActiveSolutionFile] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [userRating, setUserRating] = useState<"up" | "down" | null>(
      initialUserRating
  );
  const [canRate, setCanRate] = useState(initialCanRate);
  const [ratingLoading, startRatingTransition] = useTransition();

  const files: FileNode[] = useMemo(
      () =>
          Object.entries(codeFolder.files).map(([path, content]) => ({
            type: "file",
            path,
            name: path,
            content,
          })),
      [codeFolder.files]
  );




  const solutionFiles: FileNode[] = files
      .filter(f => f.path.startsWith("/solution"))
      .map(f => ({ ...f, type: "file" })
  );


  const templateFiles = files.filter((file) =>
      file.path.startsWith("/template")
  );

  // Store current editor content for each file
  const [fileContents, setFileContents] = useState<string[]>(
      () => files.map((file) => file.content)
  );

  const { messages, connect, clearMessages } =
      useSSE<StreamingJobResult>("/api/stream");

  /** Update editor content for a specific file */
  function setEditorContent(
      value: string | ((prev: string) => string),
      filePath: string
  ) {
    if (resetting) return;
    setFileContents((prev) =>
        prev.map((content, i) =>
            files[i].path === filePath
                ? typeof value === "function"
                    ? value(content)
                    : value
                : content
        )
    );
  }


  const handleSolutionClick = () => {
    if (
        window.confirm(
            "Are you sure you want to view the solution? This will show you the complete answer to the problem."
        )
    ) {
      setLeftPanelView("solution");
    }
  };

  const onSubmit = async () => {
    clearMessages();
    connect();
    const payload: nodeSpec = {
      files: Object.fromEntries(
          files.map((f, i) => [f.path, fileContents[i]])
      ),
      envs: codeFolder.envs,
    };
    await submitCode(payload, { params: { id: exerciseId } });
    setCanRate(true);
  };

  const onSave = async () => {
    clearMessages();
    const payload: nodeSpec = {
      files: Object.fromEntries(
          files.map((f, i) => [f.path, fileContents[i]])
      ),
      envs: codeFolder.envs,
    };
    const result = await saveCode(payload, { params: { id: exerciseId } });
    if (result.error) toast.error(`Error saving code: ${result.error}`);
    else toast.success("Code saved successfully!");
    setCanRate(true);
  };

  const onReset = async () => {
    if (!window.confirm("Are you sure you want to reset your code?")) return;

    setResetting(true);
    try {
      const result = await resetCode({ params: { id: exerciseId } });
      if (result.success) {
        setFileContents(templateFiles.map((f) => f.content));
        toast.success("Code reset successfully!");
      } else {
        toast.error(result.error || "Failed to reset code");
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setResetting(false);
    }
  };

  const handleRating = (liked: boolean) => {
    if (!canRate) {
      toast.error("Submit at least once before rating this exercise.");
      return;
    }
    startRatingTransition(async () => {
      try {
        const result = await rateExercise({ params: { id: exerciseId } }, liked);
        if (result.success) {
          setUserRating(liked ? "up" : "down");
          toast.success(`You rated this exercise ${liked ? "👍" : "👎"}`);
        } else toast.error(result.error || "Failed to rate exercise");
      } catch (_) {
        toast.error("Error submitting rating");
      }
    });
  };

  return (
      <ResizablePanelGroup direction="horizontal" className="flex-1 border md:min-w-[450px]">
        {/* Left Panel */}
        <ResizablePanel minSize={20} className="overflow-y-auto">
          <div className="flex flex-col h-full">
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

            <div className="flex-1 overflow-y-auto">
              {leftPanelView === "problem" ? (
                  <MarkdownPreview content={problemMarkdown} />
              ) : (
                  <div className="h-full flex flex-col">
                    {solutionFiles.length > 1 && (
                        <div className="flex border-b bg-muted">
                          {solutionFiles.map((file, i) => (
                              <Button
                                  key={file.name}
                                  variant={activeSolutionFile === i ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => setActiveSolutionFile(i)}
                                  className="rounded-none border-r"
                              >
                                {file.name}
                              </Button>
                          ))}
                        </div>
                    )}
                    <div className="flex-1">
                      <Editor
                          file={solutionFiles[activeSolutionFile]}
                          setEditorContent={() => {}}
                          language="go"
                          options={{ readOnly: true }}
                      />
                    </div>
                  </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel */}
        <ResizablePanel minSize={20}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50}>
              <EditorHeader
                  files={files.map((f) => ({ name: f.name, fileType: f.path.endsWith(".go") ? "go" : "markdown" }))}
                  activeFile={activeFile}
                  onFileChange={setActiveFile}
                  onSubmit={onSubmit}
                  onSave={onSave}
                  onReset={onReset}
                  disabled={resetting}
              />

              <Editor
                  file={files[activeFile]}
                  setEditorContent={setEditorContent}
                  options={{ readOnly: resetting, minimap: { enabled: false } }}
              />


              {resetting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Resetting to starter code...</span>
                    </div>
                  </div>
              )}
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50}>
              <TerminalOutput messages={messages} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
  );
}