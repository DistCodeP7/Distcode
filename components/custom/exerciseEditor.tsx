"use client";

import { BookOpen, Code, Save, Send } from "lucide-react";
import { type SetStateAction, useState } from "react";
import { toast } from "sonner";
import type { StreamingJobResult } from "@/app/api/stream/route";
import type { Filemap } from "@/app/exercises/[id]/actions";
import { resetCode, saveCode, submitCode } from "@/app/exercises/[id]/actions";
import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import { TerminalOutput } from "@/components/custom/TerminalOutput";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { Paths } from "@/drizzle/schema";
import { useSSE } from "@/hooks/useSSE";
import { FolderSystem } from "./folderSystem";

type ExerciseEditorProps = {
  exerciseId: number;
  problemMarkdown: string;
  studentCode: Paths;
  solutionCode: string;
  protocalCode: string;
  testCasesCode: Paths;
  savedCode?: Paths | null;
  userRating?: "up" | "down" | null;
  canRate?: boolean;
};

export default function ExerciseEditor({
  exerciseId,
  problemMarkdown,
  studentCode,
  testCasesCode,
  solutionCode,
  protocalCode,
  savedCode,
}: ExerciseEditorProps) {
  const initialContents: Paths = savedCode ?? studentCode;
  const initialOrder = Object.keys(initialContents);
  const [fileContents, setFileContents] = useState<Paths>(initialContents);
  const [fileOrder, setFileOrder] = useState<string[]>(initialOrder);
  const [activeFile, setActiveFile] = useState<string>(initialOrder[0] || "");
  const allOtherFiles: Filemap = {
    ...testCasesCode,
    "/protocol/protocol.go": protocalCode,
  };
  const [resetting, setResetting] = useState(false);

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
    const allFiles: Filemap = { ...allOtherFiles };
    fileOrder.forEach((path) => {
      allFiles[path] = fileContents[path];
    });
    const problemContentMap: Filemap = {};
    fileOrder.forEach((p) => {
      problemContentMap[p] = fileContents[p] ?? "";
    });

    await submitCode(problemContentMap, { params: { id: exerciseId } });
  };

  const onCreateFile = async (filename: string, parentPath = "student") => {
    if (filename.includes("main.go")) {
      toast.error("Cannot create a file named main.go");
      return;
    }
    if (filename.endsWith("/")) {
      const folderName = filename.replace(/^\/+|\/+$/g, "");
      const placeholderPath = `${parentPath}/${folderName}/${folderName}.go`;
      const defaultContent = `// New file for ${folderName}`;
      setFileContents((prev) => ({
        ...prev,
        [placeholderPath]: defaultContent,
      }));
      setFileOrder((prev) => {
        const newOrder = [...prev, placeholderPath];
        setActiveFile(placeholderPath);
        return newOrder;
      });
      return;
    }
    const namePart = filename.startsWith("/") ? filename.slice(1) : filename;
    const withExt = namePart.includes(".") ? namePart : `${namePart}.go`;
    const fullPath = `${parentPath}/${withExt}`;
    const defaultContent = `// New file: ${withExt}`;
    setFileContents((prev) => ({ ...prev, [fullPath]: defaultContent }));
    setFileOrder((prev) => {
      const newOrder = [...prev, fullPath];
      setActiveFile(fullPath);
      return newOrder;
    });
  };
  const onDeleteFile = async (path: string) => {
    if (fileOrder.length <= 1) {
      toast.error("Cannot delete the last remaining file.");
      return;
    }
    const index = fileOrder.indexOf(path);
    if (index === -1) return;
    const pathToDelete = fileOrder[index];
    if (pathToDelete.includes("/student/main.go")) {
      toast.error("Cannot delete the main.go file.");
      return;
    }

    const newOrder = fileOrder.filter((p) => p !== pathToDelete);
    setFileOrder(newOrder);
    setFileContents((prev) => {
      const copy = { ...prev };
      delete copy[pathToDelete];
      return copy;
    });
    if (activeFile === pathToDelete) {
      const newIndex = Math.max(0, index - 1);
      setActiveFile(newOrder[newIndex] || "");
    }
  };

  const onSave = async () => {
    clearMessages();

    const saveMap: Paths = {};
    fileOrder.forEach((p) => {
      saveMap[p] = fileContents[p] ?? "";
    });
    const result = await saveCode(saveMap, {
      params: { id: exerciseId },
    });

    if (result.error) {
      toast.error(`Error saving code: ${result.error}`);
    } else {
      toast.success("Code saved successfully!");
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
        setFileContents({ ...studentCode });
        setFileOrder(Object.keys(studentCode));
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

  function setEditorContent(value: SetStateAction<string>): void {
    if (resetting) return;
    setFileContents((prev) => {
      const currentPath = activeFile;
      const currentVal = prev[currentPath] ?? "";
      const newVal = typeof value === "function" ? value(currentVal) : value;
      return { ...prev, [currentPath]: newVal };
    });
  }

  const editorActions = (
    <>
      <Button
        type="button"
        variant="secondary"
        className="flex items-center gap-1 px-2 py-1 text-base"
        onClick={onSave}
        disabled={resetting}
      >
        <Save className="w-4 h-4" />
        Save
      </Button>

      <Button
        onClick={onSubmit}
        type="button"
        variant="default"
        className="flex items-center gap-1 px-2 py-1 text-base"
        disabled={resetting}
      >
        <Send className="w-4 h-4" />
        Submit
      </Button>

      <Button
        onClick={onReset}
        type="button"
        variant="outline"
        className="flex items-center gap-1 px-2 py-1 text-base"
        disabled={resetting}
      >
        <Send className="w-4 h-4" />
        Reset To Starter Code
      </Button>
    </>
  );

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex-1 border md:min-w-[450px]"
    >
      {/* Panel 1: Left Panel (Problem Markdown or Solution View) */}
      <ResizablePanel minSize={20} defaultSize={35} className="overflow-y-auto">
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
                  <MarkdownPreview
                    content={solutionFiles[activeSolutionFile]?.content || ""}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>

      {/* Handle 1: Separator between Panel 1 (Problem) and Panel 2 (File System) */}
      <ResizableHandle withHandle />

      {/* Panel 2: Folder System */}
      <ResizablePanel minSize={10} defaultSize={15}>
        <FolderSystem
          files={fileContents}
          onFileChange={setActiveFile}
          onCreateFile={onCreateFile}
          onDeleteFile={onDeleteFile}
        />
      </ResizablePanel>

      {/* Handle 2: Separator between Panel 2 (File System) and Panel 3 (Editor/Terminal) */}
      <ResizableHandle withHandle />

      {/* Panel 3: Right Panel (Editor + Terminal Output) */}
      <ResizablePanel minSize={30} defaultSize={50}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={50}>
            <EditorHeader actions={editorActions} />

            <Editor
              editorContent={fileContents[activeFile]}
              setEditorContent={setEditorContent}
              language={activeFile?.endsWith(".go") ? "go" : "markdown"}
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
