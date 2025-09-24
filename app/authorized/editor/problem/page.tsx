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
import { useProblemEditor } from "@/hooks/useProblemEditor";

const files = [
  { name: "Problem.md", fileType: "markdown" as const },
  { name: "Template.go", fileType: "go" as const },
  { name: "Solution.go", fileType: "go" as const },
  { name: "TestCases.go", fileType: "go" as const },
] as const;

export default function ProblemEditorPage() {
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
    filesContent,
  } = useProblemEditor(files);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-background flex flex-col gap-2">
        <div className="flex flex-row items-center gap-4">
          <Input
            type="text"
            placeholder="Problem title example: Leader Election"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 text-3xl font-bold bg-transparent outline-none border-none disabled:opacity-50 min-w-0"
            style={{ minHeight: "2.75rem" }}
          />
          <div className="w-48 min-w-[10rem]">
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full text-base font-medium">
                <SelectValue placeholder="Select difficulty">
                  {difficulty === "1" && (
                    <span className="font-semibold text-chart-2">Easy</span>
                  )}
                  {difficulty === "2" && (
                    <span className="font-semibold text-chart-3">Medium</span>
                  )}
                  {difficulty === "3" && (
                    <span className="font-semibold text-primary">Hard</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  <span className="font-semibold text-chart-2">Easy</span>
                </SelectItem>
                <SelectItem value="2">
                  <span className="font-semibold text-chart-3">Medium</span>
                </SelectItem>
                <SelectItem value="3">
                  <span className="font-semibold text-primary">Hard</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Input
          type="text"
          placeholder="Short description of the problem..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 border md:min-w-[450px]"
      >
        <ResizablePanel minSize={20} className="overflow-y-auto">
          <MarkdownPreview content={filesContent[0]} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel minSize={20} className="flex flex-col">
          <EditorHeader
            files={[...files]}
            activeFile={activeFile}
            onFileChange={setActiveFile}
            onSubmit={handleSubmit}
          />
          <Editor
            editorContent={filesContent[activeFile]}
            setEditorContent={handleEditorContentChange}
            language={activeFile === 0 ? "markdown" : "go"}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
