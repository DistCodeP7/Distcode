"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import type { Filemap } from "@/drizzle/schema";

// FileDef not required here; we derive file lists from the Filemap

export default function ProblemEditorClient({
  files,
  initialFilesContent,
  initialTitle,
  initialDescription,
  initialDifficulty,
  problemId,
}: {
  files: Filemap;
  initialFilesContent?: Filemap;
  initialTitle?: string;
  initialDescription?: string;
  initialDifficulty?: string;
  problemId?: number;
}) {
  // Normalize incoming `files` prop. It may be:
  // - a Filemap (Map<string,string>)
  // - a plain object { filename: content }
  // - a nodeSpec-like object { name, files, envs }
  const normalizeToMap = (inp: typeof files): Filemap => {
    if (inp instanceof Map) return new Map(inp);
    if (inp && typeof inp === "object") {
      const asObj = inp as Record<string, unknown>;
      const maybeFiles = asObj.files;
      if (maybeFiles instanceof Map)
        return new Map(maybeFiles as Map<string, string>);
      if (maybeFiles && typeof maybeFiles === "object")
        return new Map(Object.entries(maybeFiles as Record<string, string>));
      return new Map(Object.entries(asObj as Record<string, string>));
    }
    return new Map();
  };

  // Ensure we have a Map instance and keep insertion order
  const [currentFiles, setCurrentFiles] = useState<Filemap>(
    normalizeToMap(files)
  );
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  // Build ordered file arrays derived from the Map for the hook and header
  const fileList = Array.from(currentFiles.keys()).map((k) =>
    k.startsWith("/") ? k : `/${k}`
  );

  const filesForHook = fileList.map(
    (name) =>
      ({
        name,
        fileType: (name.endsWith(".md") ? "markdown" : "go") as
          | "markdown"
          | "go",
      }) as const
  );

  const filesForHeader = fileList.map(
    (name) =>
      ({
        name: name.replace(/^\//, ""),
        fileType: (name.endsWith(".md") ? "markdown" : "go") as
          | "markdown"
          | "go",
      }) as const
  );

  const pairCount = filesForHook.filter((f) =>
    f.name.startsWith("/template")
  ).length;

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
  } = useProblemEditor(filesForHook, {
    filesContent: initialFilesContent,
    title: initialTitle,
    description: initialDescription,
    difficulty: initialDifficulty,
    problemId,
  });

  const addFilesPair = () => {
    const next = pairCount + 1;
    const newEntries: [string, string][] = [
      [
        `/template/template${next === 1 ? "" : next}.go`,
        "// Write your template code here\n",
      ],
      [
        `/solution/solution${next === 1 ? "" : next}.go`,
        "// Write your solution code here\n",
      ],
    ];

    setCurrentFiles((prev) => {
      const entries = Array.from(prev.entries());
      const index = entries.findIndex(([name]) => name.startsWith("/test"));
      if (index === -1) {
        return new Map([...entries, ...newEntries]);
      }
      const newEntriesArr = [
        ...entries.slice(0, index),
        ...newEntries,
        ...entries.slice(index),
      ];
      return new Map(newEntriesArr);
    });
  };

  const removeFilesPair = () => {
    if (pairCount <= 1) return;
    setCurrentFiles((prev) => {
      const entries = Array.from(prev.entries());
      const reversed = [...entries].reverse();
      const lastTemplate = reversed.find(([name]) =>
        name.includes("template")
      )?.[0];
      const lastSolution = reversed.find(([name]) =>
        name.includes("solution")
      )?.[0];
      const filtered = entries.filter(
        ([name]) => name !== lastTemplate && name !== lastSolution
      );
      return new Map(filtered);
    });
  };

  useEffect(() => {
    if (activeFile >= filesForHook.length)
      setActiveFile(Math.max(0, filesForHook.length - 1));
  }, [filesForHook, activeFile, setActiveFile]);

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
          <MarkdownPreview content={filesContent.get("/problem.md") || ""} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          minSize={20}
          className="flex-1 flex flex-col min-w-0 overflow-hidden"
        >
          <EditorHeader
            files={filesForHeader}
            activeFile={activeFile}
            onFileChange={setActiveFile}
            onSubmit={handleSubmit}
            onSave={handleSave}
            onReset={() => {}}
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
              editorContent={
                filesContent.get(filesForHook[activeFile]?.name || "") || ""
              }
              setEditorContent={handleEditorContentChange}
              language={
                filesForHook[activeFile]?.fileType === "markdown"
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
