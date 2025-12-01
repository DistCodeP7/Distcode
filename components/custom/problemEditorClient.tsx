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
import type { Paths } from "@/drizzle/schema";
import { useProblemEditor } from "@/hooks/useProblemEditor";
import { FolderSystem } from "./folderSystem";

export default function ProblemEditorClient({
  files,
  initialFilesContent,
  initialTitle,
  initialDescription,
  initialDifficulty,
  problemId,
}: {
  files: Paths;
  initialFilesContent?: Paths;
  initialTitle?: string;
  initialDescription?: string;
  initialDifficulty?: string;
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
    handleCreateFile,
    handleDeleteFile,
    filesContent,
  } = useProblemEditor(files, {
    filesContent: files ?? initialFilesContent,
    title: initialTitle,
    description: initialDescription,
    difficulty: initialDifficulty,
    problemId,
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
      </div>

      {/* Editor + Preview */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 border h-full w-full min-w-0"
      >
        <ResizablePanel minSize={20} className="flex-1 min-w-0 overflow-auto">
          {/* Show the problem markdown: try to find a problem.* key in filesContent */}
          <MarkdownPreview
            content={
              filesContent[
                Object.keys(filesContent).find((k) => {
                  const kk = k.startsWith("/") ? k.slice(1) : k;
                  return kk === "problem.md" || kk.startsWith("problem");
                }) || Object.keys(filesContent)[0]
              ] || ""
            }
          />
        </ResizablePanel>
        <ResizablePanel
          minSize={12}
          className="w-56 min-w-[12rem] bg-background border-r overflow-auto cursor-col-resize"
        >
          <FolderSystem
            files={filesContent}
            onFileChange={setActiveFile}
            activeFilePath={activeFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
          />
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
            {(() => {
              const content = filesContent[activeFile] || "";
              const name = activeFile
                ? activeFile.startsWith("/")
                  ? activeFile.slice(1)
                  : activeFile
                : "";
              const language =
                name.endsWith(".md") ||
                name.startsWith("problem") ||
                name.startsWith("solution")
                  ? "markdown"
                  : "go";

              return (
                <Editor
                  editorContent={content}
                  setEditorContent={handleEditorContentChange}
                  language={language}
                />
              );
            })()}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
