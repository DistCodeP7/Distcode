"use client";

import { BookOpen, Code, Save, Send, X } from "lucide-react";
import { type SetStateAction, useRef, useState } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { toast } from "sonner";
import type { Filemap } from "@/app/exercises/[id]/actions";
import { resetCode, saveCode, submitCode, cancelJobRequest } from "@/app/exercises/[id]/actions";
import { ConfirmDialog } from "@/components/custom/confirmDialog";
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
import type { StreamingJobMessage } from "@/types/streamingEvents";
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
  const [currentJobUid, setCurrentJobUid] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const [leftPanelView, setLeftPanelView] = useState<"problem" | "solution">(
    "problem"
  );
  const [activeSolutionFile, setActiveSolutionFile] = useState(0);

  const solutionFiles = solutionCode
    ? [{ name: "main.go", content: solutionCode }]
    : [];

  const { messages, connect, clearMessages } =
    useSSE<StreamingJobMessage>("/api/stream");

  const folderPanelRef = useRef<ImperativePanelHandle>(null);
  const problemPanelRef = useRef<ImperativePanelHandle>(null);
  const editorPanelRef = useRef<ImperativePanelHandle>(null);

  const [showSolutionDialog, setShowSolutionDialog] = useState(false);
  const [solutionDialogConfirmed, setSolutionDialogConfirmed] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

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
    const result = await submitCode(problemContentMap, { params: { id: exerciseId } });
      if (result?.jobUid) { setCurrentJobUid(result.jobUid); }
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
    if (pathToDelete.includes("student/main.go")) {
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
    setShowResetDialog(true);
  };

  const confirmReset = async () => {
    setShowResetDialog(false);
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
        variant="outline"
        className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
        onClick={onSave}
        disabled={resetting}
      >
        <Save className="w-4 h-4" />
        Save
      </Button>

      <Button
        onClick={onSubmit}
        type="button"
        variant="outline"
        className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
        disabled={resetting}
      >
        <Send className="w-4 h-4" />
        Submit
      </Button>

      <Button
        onClick={onReset}
        type="button"
        variant="outline"
        className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
        disabled={resetting}
      >
        <Send className="w-4 h-4" />
        Reset Code
      </Button>
    </>
  );

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
      <ConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset Code?"
        description="Are you sure you want to reset your code? This will remove your saved progress and restore the original template."
        confirmLabel="Reset"
        onConfirm={confirmReset}
      />
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 border md:min-w-[450px] overflow-x-hidden"
      >
        {/* Panel 1: Folder System (collapsible) */}
        <ResizablePanel
          minSize={10}
          defaultSize={15}
          collapsible
          ref={folderPanelRef}
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
              <FolderSystem
                files={fileContents}
                onFileChange={setActiveFile}
                onCreateFile={onCreateFile}
                onDeleteFile={onDeleteFile}
              />
            </div>
          </div>
        </ResizablePanel>

        {/* Handle 1: Separator between Panel 1 (File System) and Panel 2 (Problem) */}
        <ResizableHandle withHandle handleClassName="self-start mt-20" />

        {/* Panel 2: Middle Panel (Problem Markdown or Solution View) */}
        <ResizablePanel
          minSize={20}
          defaultSize={35}
          collapsible
          ref={problemPanelRef}
          className="overflow-y-auto"
        >
          <div className="flex flex-col h-full">
            {/* Toggle buttons for left panel */}
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

        {/* Handle 2: Separator between Panel 2 (Problem) and Panel 3 (Editor/Terminal) */}
        <ResizableHandle withHandle />

        {/* Panel 3: Right Panel (Editor + Terminal Output) */}
        <ResizablePanel
          minSize={30}
          defaultSize={50}
          collapsible
          ref={editorPanelRef}
        >
          {/* The vertical panel group must be constrained to the height of Panel 3. */}
          <ResizablePanelGroup direction="vertical" className="h-full min-h-0">
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
            {/* Ensures TerminalOutput's flex-1 root correctly calculates height. */}
            <div className="h-full">
              <div className="h-full flex flex-col min-h-0">
                <div className="flex-1 min-h-0">
                  <TerminalOutput messages={messages} />
                </div>
                <div className="flex justify-end p-2">
                  <Button
                      variant="secondary"
                      className="hover:cursor-pointer hover:bg-primary/55"
                      onClick={() => {
                        if (currentJobUid) {
                          cancelJobRequest(currentJobUid);
                        }
                      }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel submission
                  </Button>
                </div>
              </div>
            </div>
          </ResizablePanel>

        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
