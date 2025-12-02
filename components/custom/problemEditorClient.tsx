"use client";
import { Send } from "lucide-react";
import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { Paths } from "@/drizzle/schema";
import { useProblemEditor } from "@/hooks/useProblemEditor";
import { FolderSystem } from "./folderSystem";

export default function ProblemEditorClient({
  files,
  initialFilesContent,
  problemId,
}: {
  files: Paths;
  initialFilesContent?: Paths;
  problemId?: number;
}) {
  const {
    activeFile,
    setActiveFile,
    handleEditorContentChange,
    handleSubmit,
    handleCreateFile,
    handleDeleteFile,
    filesContent,
  } = useProblemEditor(files, {
    filesContent: files ?? initialFilesContent,
    problemId,
  });

  const editorActions = (
    <Button
      onClick={handleSubmit}
      type="button"
      variant="default"
      className="flex items-center gap-1 px-2 py-1 text-base"
    >
      <Send className="w-4 h-4" />
      {problemId ? "Update Problem" : "Create Problem"}
    </Button>
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Editor + Preview */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 border h-full w-full min-w-0"
      >
        {/* Panel 1: Markdown Preview (Problem Description) */}
        <ResizablePanel
          minSize={20}
          defaultSize={35}
          className="flex-1 min-w-0 overflow-auto"
        >
          {/* Show the problem markdown: try to find a problem.* key in filesContent */}
          <MarkdownPreview
            content={
              filesContent[
                Object.keys(filesContent).find((k) => {
                  return k === "problem.md" || k.startsWith("problem");
                }) || Object.keys(filesContent)[0]
              ] || ""
            }
          />
        </ResizablePanel>

        {/* Handle 1: Separates Panel 1 and Panel 2 */}
        <ResizableHandle withHandle />

        {/* Panel 2: Folder System */}
        <ResizablePanel
          minSize={12}
          defaultSize={25}
          className="bg-background border-r overflow-auto"
        >
          <FolderSystem
            files={filesContent}
            onFileChange={setActiveFile}
            activeFilePath={activeFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
          />
        </ResizablePanel>

        {/* Handle 2: Separates Panel 2 and Panel 3 */}
        <ResizableHandle withHandle />

        {/* Panel 3: Code Editor */}
        <ResizablePanel
          minSize={20}
          defaultSize={40}
          className="flex-1 flex flex-col min-w-0 overflow-hidden"
        >
          <EditorHeader actions={editorActions} />

          <div className="flex-1 overflow-auto min-w-0">
            {(() => {
              const content = filesContent[activeFile] || "";
              const name = activeFile ?? "";
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
