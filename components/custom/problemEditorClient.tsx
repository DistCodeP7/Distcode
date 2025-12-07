"use client";
import { Save, Send } from "lucide-react";
import { useMemo, useRef } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
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
import { FolderSystem } from "@/components/custom/folder-system/FolderSystem";

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
    handleSave,
    handleCreateFile,
    handleDeleteFile,
    filesContent,
    lastMarkdownFile,
  } = useProblemEditor(files, {
    filesContent: files ?? initialFilesContent,
    problemId,
  });

  const folderPanelRef = useRef<ImperativePanelHandle>(null);
  const problemPanelRef = useRef<ImperativePanelHandle>(null);

  const previewFile = useMemo(() => {
    const keys = Object.keys(filesContent);
    const isActiveMarkdown = !!activeFile && activeFile.endsWith(".md");

    if (isActiveMarkdown) {
      return activeFile;
    }

    if (filesContent[lastMarkdownFile]) {
      return lastMarkdownFile;
    }

    return (
      keys.find((k) => k === "problem.md" || k === "solution.md") || keys[0]
    );
  }, [activeFile, filesContent, lastMarkdownFile]);

  const editorActions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSave}
        type="button"
        variant="secondary"
        className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
      >
        <Save className="w-4 h-4" />
        Save
      </Button>
      <Button
        onClick={handleSubmit}
        type="button"
        variant="default"
        className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
      >
        <Send className="w-4 h-4" />
        {problemId ? "Update Problem" : "Create Problem"}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 border h-full w-full min-w-0"
      >
        {/* Panel 1: Folder System (Collapsible) */}
        <ResizablePanel
          minSize={4}
          maxSize={20}
          defaultSize={15}
          collapsible
          ref={folderPanelRef}
        >
          <FolderSystem
            files={filesContent}
            onFileChange={setActiveFile}
            activeFilePath={activeFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
          />
        </ResizablePanel>

        {/* Handle 1: Separates Panel 1 and Panel 2 */}
        <ResizableHandle withHandle />

        {/* Panel 2 Markdown Preview (Problem Description / Solution) */}
        <ResizablePanel
          minSize={20}
          defaultSize={35}
          collapsible
          ref={problemPanelRef}
        >
          <MarkdownPreview content={filesContent[previewFile]} />
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
              const language = name.endsWith(".md") ? "markdown" : "go";

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
