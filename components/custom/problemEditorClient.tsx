"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
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
import type { Filemap, EnvironmentVariable } from "@/drizzle/schema";
import { useProblemEditor } from "@/hooks/useProblemEditor";

export default function ProblemEditorClient({
  files,
  initialFilesContent,
  initialTitle,
  initialDescription,
  initialDifficulty,
  initialBuildCommand,
  initialEntryCommand,
  initialEnvs,
  problemId,
}: {
  files: Filemap;
  initialFilesContent?: Filemap;
  initialTitle?: string;
  initialDescription?: string;
  initialDifficulty?: string;
  initialBuildCommand?: string;
  initialEntryCommand?: string;
  initialEnvs?: EnvironmentVariable[];
  problemId?: number;
}) {
  const [currentFiles, setCurrentFiles] = useState<string[]>(
    Object.keys(files)
  );
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const filesForHook: { name: string; fileType: "go" | "markdown" }[] =
    currentFiles.map((name: string) => ({
      name: String(name),
      fileType: name.endsWith(".go") ? "go" : "markdown",
    }));

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
    buildCommand,
    entryCommand,
    setBuildCommand,
    setEntryCommand,
    envs,
    setEnvs,
  } = useProblemEditor(filesForHook, {
    filesContent: initialFilesContent,
    title: initialTitle,
    description: initialDescription,
    difficulty: initialDifficulty,
    problemId,
    buildCommand: initialBuildCommand,
    entryCommand: initialEntryCommand,
    envs: initialEnvs,
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
      const entries = [...prev];
      const index = entries.findIndex((name) => name.startsWith("/test"));
      const insertNames = newEntries.map(([p]) => p);
      if (index === -1) return [...entries, ...insertNames];
      return [
        ...entries.slice(0, index),
        ...insertNames,
        ...entries.slice(index),
      ];
    });
  };

  const removeFilesPair = () => {
    if (pairCount <= 1) return;
    setCurrentFiles((prev) => {
      const entries = [...prev];
      const toRemove = new Set<string>();
      // Walk from the end and collect up to two matches (template + solution) and then remove them
      for (let i = entries.length - 1; i >= 0 && toRemove.size < 2; i--) {
        const n = entries[i];
        if (n.includes("/template") || n.includes("/solution")) {
          toRemove.add(n);
        }
      }
      if (toRemove.size === 0) return entries;
      return entries.filter((name) => !toRemove.has(name));
    });
  };

  const safeActiveFile = Math.min(
    activeFile,
    Math.max(0, filesForHook.length - 1)
  );

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
        <div className="flex gap-3">
          <Input
            placeholder="Build command (e.g. go build ./...)"
            value={buildCommand}
            onChange={(e) => setBuildCommand(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Entry command (e.g. ./solution)"
            value={entryCommand}
            onChange={(e) => setEntryCommand(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Environment Variables
            </span>
            <Button
              onClick={() => setEnvs([...(envs ?? []), { key: "", value: "" }])}
              size="sm"
              variant="outline"
              className="flex items-center gap-1 px-2 py-1"
            >
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
          {(envs ?? []).map((ev, idx) => (
            <div key={`${ev.key}-${idx}`} className="flex gap-2 items-center">
              <Input
                placeholder="KEY"
                value={ev.key}
                onChange={(e) => {
                  const next = [...(envs ?? [])];
                  next[idx] = { ...next[idx], key: e.target.value };
                  setEnvs(next);
                }}
                className="w-1/3"
              />
              <Input
                placeholder="VALUE"
                value={ev.value}
                onChange={(e) => {
                  const next = [...(envs ?? [])];
                  next[idx] = { ...next[idx], value: e.target.value };
                  setEnvs(next);
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const next = (envs ?? []).filter((_, i) => i !== idx);
                  setEnvs(next);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor + Preview */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 border h-full w-full min-w-0"
      >
        <ResizablePanel minSize={20} className="flex-1 min-w-0 overflow-auto">
          <MarkdownPreview
            content={
              (filesContent as Record<string, string>)["/problem.md"] || ""
            }
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          minSize={20}
          className="flex-1 flex flex-col min-w-0 overflow-hidden"
        >
          <EditorHeader
            files={filesForHook.map((f) => ({
              ...f,
            }))}
            activeFile={safeActiveFile}
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
                (filesContent as Record<string, string>)[
                  filesForHook[safeActiveFile]?.name || ""
                ] || ""
              }
              setEditorContent={handleEditorContentChange}
              language={
                filesForHook[safeActiveFile]?.fileType === "go"
                  ? "go"
                  : "markdown"
              }
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
