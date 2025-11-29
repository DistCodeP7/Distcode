"use client";
import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
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
import { FolderSystem } from "./folderSystem";

export type FileDef = { name: string; fileType: "go" | "markdown" };

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
  } = useProblemEditor(files, {
    filesContent: initialFilesContent,
    title: initialTitle,
    description: initialDescription,
    difficulty: initialDifficulty,
    problemId,
    buildCommand: initialBuildCommand,
    entryCommand: initialEntryCommand,
    envs: initialEnvs,
  });

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
        <ResizablePanel
          minSize={12}
          className="w-56 min-w-[12rem] bg-background border-r overflow-auto cursor-col-resize"
        >
          <FolderSystem files={files} onFileChange={setActiveFile} />
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel
          minSize={20}
          className="flex-1 flex flex-col min-w-0 overflow-hidden"
        >
          <EditorHeader
            onSubmit={handleSubmit}
            onSave={handleSave}
            onReset={() => {}}
          />

          <div className="flex-1 overflow-auto min-w-0">
            <Editor
              editorContent={filesContent[files[activeFile]?.name] || ""}
              setEditorContent={handleEditorContentChange}
              language={
                files[activeFile]?.fileType === "markdown" ? "markdown" : "go"
              }
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
