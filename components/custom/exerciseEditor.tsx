"use client";

import { BookOpen, Code, ThumbsDown, ThumbsUp } from "lucide-react";
import type React from "react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import type { StreamingJobResult } from "@/app/api/stream/route";
import type { Filemap } from "@/app/exercises/[id]/actions";
import {
  rateExercise,
  resetCode,
  saveCode,
} from "@/app/exercises/[id]/actions";
import Editor, { EditorHeader } from "@/components/custom/editor";
import type { FileDef } from "./problemEditorClient";
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
import { FolderSystem } from "./folderSystem";

type ExerciseEditorProps = {
  exerciseId: number;
  problemMarkdown: string;
  templateCode: string[];
  solutionCode: string;
  protocalCode: string;
  testCasesCode: string[];
  savedCode?: string[] | null;
  userRating?: "up" | "down" | null;
  canRate?: boolean;
};

type FileDatas = {
  path: string;
  name: string;
  content: string;
  fileType: "go" | "markdown";
};

export default function ExerciseEditor({
  exerciseId,
  problemMarkdown,
  templateCode,
  testCasesCode,
  solutionCode,
  protocalCode,
  savedCode,
  userRating: initialUserRating = null,
  canRate: initialCanRate = false,
}: ExerciseEditorProps) {
  const [activeFile, setActiveFile] = useState(0);

  const files: FileDatas[] = useMemo(
    () =>
      Object.entries(codeFolder.Files).map(([path, content]) => ({
        path,
        name: path,
        content,
        fileType: path.endsWith(".go") ? "go" : "markdown",
      })),
    [codeFolder.Files]
  );

  const [fileContents, setFileContents] = useState<string[]>(() =>
    files.map((file) => file.content)
  );

  const solutionFiles = files.filter((file) =>
    file.path.startsWith("/solution")
  );
  // Maintain file metadata (name + type) separately so created files keep their names
  const [files, setFiles] = useState<FileDef[]>(() =>
    fileContents.map((_, index) => ({
      name: index === 0 ? "/student/main.go" : `/student/file${index + 1}.go`,
      fileType: "go",
    }))
  );
  const allOtherFiles: Filemap = {
    ...testCasesCode.reduce((acc, code, idx) => {
      acc[`/testcases/testcase${idx + 1}.go`] = code;
      return acc;
    }, {} as Filemap),
    "/protocol/protocol.go": protocalCode,
  };
  const [resetting, setResetting] = useState(false);
  const [userRating, setUserRating] = useState<"up" | "down" | null>(
    initialUserRating
  );
  const [canRate, setCanRate] = useState(initialCanRate);
  const [ratingLoading, startRatingTransition] = useTransition();
  const [leftPanelView, setLeftPanelView] = useState<"problem" | "solution">(
    "problem"
  );
  const [activeSolutionFile, setActiveSolutionFile] = useState(0);

  const solutionFiles = solutionCode
    ? [{ name: "main.go", content: solutionCode }]
    : [];

  const { messages, connect, clearMessages } =
    useSSE<StreamingJobResult>("/api/stream");

  const handleSolutionClick = () => {
    const shouldViewSolution = window.confirm(
      "Are you sure you want to view the solution? This will show you the complete answer to the problem."
    );
    if (shouldViewSolution) setLeftPanelView("solution");
  };

  const onSubmit = async () => {
    clearMessages();
    connect();
    const problemContent = fileContents;
 
    const allFiles: Filemap = allOtherFiles;
    files.forEach((file, index) => {
      allFiles[file.name] = problemContent[index];
    });
    console.log("Submitting code as nodes:", allFiles);
    //await submitCode(problemContent, { params: { id: exerciseId } });
  };

  const onCreateFile = async (filename: string) => {
    const cleanFilename = filename.split(".").pop() || filename;
    const newFile: FileDef = {
      name: `/student/${cleanFilename}.go`,
      fileType: "go",
    };
    setFileContents((fcPrev) => {
      const newIndex = fcPrev.length;
      const defaultContent = `// New file: ${filename}`;
      setFiles((fPrev) => [...fPrev, newFile]);
      setActiveFile(newIndex);
      return [...fcPrev, defaultContent];
    });
  };

  const onDeleteFile = async (index: number) => {
    if (files.length <= 1) {
      toast.error("Cannot delete the last remaining file.");
      return;
    }
    if (files[index].name === "/student/main.go") {
      toast.error("Cannot delete the main.go file.");
      return;
    }

    setFiles((fPrev) => fPrev.filter((_, i) => i !== index));
    setFileContents((fcPrev) => fcPrev.filter((_, i) => i !== index));

    // Adjust active file index if necessary
    setActiveFile((prevActive) => {
      if (prevActive === index) {
        return Math.max(0, prevActive - 1);
      } else if (prevActive > index) {
        return prevActive - 1;
      }
      return prevActive;
    });
  };

  const onSave = async () => {
    clearMessages();

    const payload: nodeSpec = {
      Files: Object.fromEntries(
        files.map((file, index) => [file.path, fileContents[index]])
      ),
      Envs: codeFolder.Envs,
      BuildCommand: codeFolder.BuildCommand,
      EntryCommand: codeFolder.EntryCommand,
    };

    const result = await saveCode(payload, {
      params: { id: exerciseId },
    });

    if (result.error) {
      toast.error(`Error saving code: ${result.error}`);
    } else {
      toast.success("Code saved successfully!");
      setCanRate(true); // once saved, enable rating if not already
    }
  };

  const appendProtoToMarkdown = (markdown: string, protoCode: string) => {
    return `${markdown}

## Protocol Definition

\`\`\`go
${protoCode}
\`\`\`
`;
  };

  const onReset = async () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset your code? This will remove your saved progress and restore the original template."
    );
    if (!confirmReset) return;

    setResetting(true);
    try {
      const result = await resetCode({ params: { id: exerciseId } });
      if (result.success) {
        setFileContents([...templateCode]);
        // Reset file metadata to match template files
        setFiles(
          templateCode.map((_, index) => ({
            name: index === 0 ? "main.go" : `file${index + 1}.go`,
            fileType: "go",
          }))
        );
        toast.success("Code reset successfully!", {
          description: "Template restored and saved code cleared.",
        });
      } else {
        toast.error("Failed to reset code", {
          description: result.error || "Something went wrong.",
        });
      }
    } catch (err) {
      toast.error("Error resetting code", {
        description: String(err),
      });
    } finally {
      setResetting(false);
    }
  };

  const handleRating = (liked: boolean) => {
    if (!canRate) {
      toast.error("You must submit at least once before rating this exercise.");
      return;
    }

    startRatingTransition(async () => {
      try {
        const result = await rateExercise(
          { params: { id: exerciseId } },
          liked
        );
        if (result.success) {
          setUserRating(liked ? "up" : "down");
          toast.success(`You rated this exercise ${liked ? "👍" : "👎"}`);
        } else {
          toast.error(result.error || "Failed to rate exercise");
        }
      } catch (_) {
        toast.error("Error submitting rating");
      }
    });
  };

  function setEditorContent(value: React.SetStateAction<string>): void {
    if (resetting) return; // disable editing while resetting
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
              <MarkdownPreview
                content={appendProtoToMarkdown(problemMarkdown, protocalCode)}
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
                  <Editor
                    editorContent={
                      solutionFiles[activeSolutionFile]?.content || ""
                    }
                    setEditorContent={() => {}}
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
      <ResizablePanel minSize={2} className="w-1 bg-muted/50 cursor-col-resize">
        <ResizableHandle withHandle />
        <FolderSystem
          files={files}
          onFileChange={setActiveFile}
          onCreateFile={onCreateFile}
          onDeleteFile={onDeleteFile}
        />
      </ResizablePanel>

      {/* Right panel: Editor + Terminal Output */}
      <ResizablePanel minSize={30}>
        <ResizableHandle withHandle />
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={50}>
            <EditorHeader
              onSubmit={onSubmit}
              onSave={onSave}
              onReset={onReset}
              disabled={resetting}
            />

            <div className="flex items-center justify-end gap-3 p-2 border-t bg-muted/40">
              <span className="text-sm text-muted-foreground">
                Rate this exercise:
              </span>

              <Button
                variant={userRating === "up" ? "default" : "outline"}
                size="icon"
                disabled={ratingLoading || !canRate}
                onClick={() => handleRating(true)}
                className="w-8 h-8"
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>

              <Button
                variant={userRating === "down" ? "default" : "outline"}
                size="icon"
                disabled={ratingLoading || !canRate}
                onClick={() => handleRating(false)}
                className="w-8 h-8"
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>

            <Editor
              editorContent={fileContents[activeFile] ?? ""}
              setEditorContent={setEditorContent}
              language={files[activeFile]?.fileType}
              options={{
                readOnly: resetting,
                minimap: { enabled: false },
              }}
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
