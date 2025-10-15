"use client";
import { useState, useRef } from "react";
import type { StreamingJobResult } from "@/app/api/stream/route";
import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import { TerminalOutput } from "@/components/custom/TerminalOutput";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import useCodeEditor from "@/hooks/useCodeEditor";
import { useSSE } from "@/hooks/useSSE";
import type { ImperativePanelHandle } from "react-resizable-panels";

export default function IDE() {
  const [file, setFile] = useState(0);
  const { editorContent, setEditorContent, submit } = useCodeEditor();
  const { messages, connect, clearMessages } =
    useSSE<StreamingJobResult>("/api/stream");
  const terminalPanelRef = useRef<ImperativePanelHandle | null>(null);

  const onSubmit = async () => {
    terminalPanelRef.current?.resize(30);
    clearMessages();
    connect();
    await submit();
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full border md:min-w-[450px]"
    >
      {/* Left panel: Markdown Preview */}
      <ResizablePanel minSize={20} className="overflow-y-auto">
        <MarkdownPreview />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right panel: Editor + Extra resizable panel */}
      <ResizablePanel minSize={20}>
        <ResizablePanelGroup direction="vertical">
          {/* Top half: Editor */}
          <ResizablePanel defaultSize={50}>
            <EditorHeader
              files={[
                { name: "file1.go", fileType: "go" },
                { name: "file2.erl", fileType: "erlang" },
                { name: "file2.akka", fileType: "akka" },
              ]}
              activeFile={file}
              onFileChange={(index) => setFile(index)}
              onSubmit={onSubmit}
            />
            <Editor
              editorContent={editorContent}
              setEditorContent={setEditorContent}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />
          <ResizablePanel ref={terminalPanelRef} defaultSize={0} maxSize={70}>
            <TerminalOutput messages={messages} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}