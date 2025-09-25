"use client";

import { useState } from "react";
import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useSSE } from "@/hooks/useSSE";
import { StreamingJobResult } from "@/app/api/stream/route";
import { TerminalOutput } from "@/components/custom/TerminalOutput";
import useCodeEditor from "@/hooks/useCodeEditor";

type ExerciseEditorProps = {
  userId?: number;
  problemMarkdown: string;
  templateCode: string;
  solutionCode?: string;
  testCasesCode?: string;
};

export default function ExerciseEditor({
  problemMarkdown,
  templateCode,
  solutionCode,
}: ExerciseEditorProps) {
  const files = [
    { name: "Template.go", content: templateCode, fileType: "go" as const },
    ...(solutionCode
      ? [
          {
            name: "Solution.go",
            content: solutionCode,
            fileType: "go" as const,
          },
        ]
      : []),
  ];

  const [activeFile, setActiveFile] = useState(0);
  const [fileContents, setFileContents] = useState(
    files.map((file) => file.content)
  );

  const { messages, connect, clearMessages } =
    useSSE<StreamingJobResult>("/api/stream");
  const { submit } = useCodeEditor();

  const onSubmit = async () => {
    clearMessages();
    connect();
    await submit();
  };

    function setEditorContent(value: React.SetStateAction<string>): void {
        setFileContents((prev) => {
            const newContents = [...prev];
            newContents[activeFile] =
                typeof value === "function" ? value(prev[activeFile]) : value;
            return newContents;
        });
    }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex-1 border md:min-w-[450px]"
    >
      {/* Left panel: Markdown Preview */}
      <ResizablePanel minSize={20} className="overflow-y-auto">
        <MarkdownPreview content={problemMarkdown} />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right panel: Editor + Terminal Output */}
      <ResizablePanel minSize={20}>
        <ResizablePanelGroup direction="vertical">
          {/* Editor panel */}
          <ResizablePanel defaultSize={50}>
            <EditorHeader
              files={files.map((file, x) => ({
                ...file,
                content: fileContents[x],
              }))}
              activeFile={activeFile}
              onFileChange={setActiveFile}
              onSubmit={onSubmit}
            />
            <Editor
              editorContent={fileContents[activeFile]}
              setEditorContent={setEditorContent}
              language={files[activeFile].fileType}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Terminal Output panel */}
          <ResizablePanel defaultSize={50}>
            <TerminalOutput messages={messages} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
