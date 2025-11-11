"use client";

import { useState, useEffect } from "react";
import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProblemEditor } from "@/hooks/useProblemEditor";

type FileDef = { name: string; fileType: "go" | "markdown" };

export default function ProblemEditorClient({
  files,
  initialFilesContent,
  initialTitle,
  initialDescription,
  initialDifficulty,
  problemId,
}: {
  files: FileDef[];
  initialFilesContent?: Record<string, string>;
  initialTitle?: string;
  initialDescription?: string;
  initialDifficulty?: string;
  problemId?: number;
}) {
  const [currentFiles, setCurrentFiles] = useState<FileDef[]>([...files]);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const {
    title,
    description,
    difficulty,
    activeFile,
    setTitle,
    setDescription,
    setDifficulty,
    setActiveFile,
    handleEditorContentChange,
    handleSubmit,
    handleSave,
    filesContent,
  } = useProblemEditor(currentFiles, {
    filesContent: initialFilesContent,
    title: initialTitle,
    description: initialDescription,
    difficulty: initialDifficulty,
    problemId,
  });

  const pairCount = currentFiles.filter((f) =>
    f.name.startsWith("template")
  ).length;

  const addFilesPair = () => {
    const next = pairCount + 1;
    const newFiles: FileDef[] = [
      { name: `template${next === 1 ? "" : next}.go`, fileType: "go" },
      { name: `solution${next === 1 ? "" : next}.go`, fileType: "go" },
    ];

    setCurrentFiles((prev) => {
      const index = prev.findIndex((f) => f.name === "testCases.go");
      if (index === -1) return [...prev, ...newFiles]; // Append if testCases.go not found
      return [...prev.slice(0, index), ...newFiles, ...prev.slice(index)]; // Insert before testCases.go
    });
  };

  const removeFilesPair = () => {
    if (pairCount <= 1) return;
    setCurrentFiles((prev) => {
      const lastTemplate = [...prev]
        .reverse()
        .find((f) => f.name.startsWith("template"))?.name;
      const lastSolution = [...prev]
        .reverse()
        .find((f) => f.name.startsWith("solution"))?.name;
      return prev.filter(
        (f) => f.name !== lastTemplate && f.name !== lastSolution
      );
    });
  };

  useEffect(() => {
    if (activeFile >= currentFiles.length)
      setActiveFile(Math.max(0, currentFiles.length - 1));
  }, [currentFiles, activeFile, setActiveFile]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-background flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Problem title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 text-3xl font-bold bg-transparent outline-none border-none"
          />
          <div className="w-48 min-w-[10rem]">
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full text-base font-medium">
                <SelectValue placeholder="Select difficulty">
                  {difficulty === "1" && (
                    <span className="text-chart-2 font-semibold">Easy</span>
                  )}
                  {difficulty === "2" && (
                    <span className="text-chart-3 font-semibold">Medium</span>
                  )}
                  {difficulty === "3" && (
                    <span className="text-primary font-semibold">Hard</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  <span className="text-chart-2 font-semibold">Easy</span>
                </SelectItem>
                <SelectItem value="2">
                  <span className="text-chart-3 font-semibold">Medium</span>
                </SelectItem>
                <SelectItem value="3">
                  <span className="text-primary font-semibold">Hard</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Input
          placeholder="Short description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Editor + Preview */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 border h-full w-full min-w-0"
      >
        <ResizablePanel minSize={20} className="flex-1 min-w-0 overflow-auto">
          <MarkdownPreview content={filesContent["problem.md"] || ""} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          minSize={20}
          className="flex-1 flex flex-col min-w-0 overflow-hidden"
        >
          <EditorHeader
            files={currentFiles}
            activeFile={activeFile}
            onFileChange={setActiveFile}
            onSubmit={handleSubmit}
            onSave={handleSave}
          />

          <div className="flex-shrink-0 flex items-center justify-between gap-2 p-2 border-b bg-muted/30 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">
                Go Files:
              </span>
              <Button
                onClick={addFilesPair}
                size="sm"
                variant="outline"
                className="flex items-center gap-1 px-2 py-1"
              >
                <Plus className="w-4 h-4" /> Add new file pair
              </Button>

              {pairCount > 1 && (
                <>
                  <Button
                    onClick={() => setIsRemoveDialogOpen(true)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    <X className="w-4 h-4" /> Remove latest file pair
                  </Button>
                  <Dialog
                    open={isRemoveDialogOpen}
                    onOpenChange={setIsRemoveDialogOpen}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remove file pair</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to remove the last
                          template/solution pair? This cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsRemoveDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            removeFilesPair();
                            setIsRemoveDialogOpen(false);
                          }}
                        >
                          Remove
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>

            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {pairCount} file pair{pairCount !== 1 ? "s" : ""}{" "}
              <span className="ml-1 text-primary">
                (Template + Solution each)
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto min-w-0">
            <Editor
              editorContent={filesContent[currentFiles[activeFile]?.name] || ""}
              setEditorContent={handleEditorContentChange}
              language={
                currentFiles[activeFile]?.fileType === "markdown"
                  ? "markdown"
                  : "go"
              }
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
