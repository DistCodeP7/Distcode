"use client";

import type React from "react";
import type { SetStateAction } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
// 1. Import the type
import Editor, { EditorHeader } from "@/components/custom/editor";
import { TerminalOutput } from "@/components/custom/terminal/terminalOutput";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { Paths } from "@/drizzle/schema";
import type { StreamingJobEvent } from "@/types/streamingEvents";

type EditorWithTerminalPanelProps = {
  activeFile: string;
  fileContents: Paths;
  resetting: boolean;
  setEditorContent: (value: SetStateAction<string>) => void;
  messages: StreamingJobEvent[];
  actions: React.ReactNode;
  terminalPanelRef: React.RefObject<ImperativePanelHandle | null>;
};

export function EditorWithTerminalPanel({
  activeFile,
  fileContents,
  resetting,
  setEditorContent,
  messages,
  actions,
  terminalPanelRef,
}: EditorWithTerminalPanelProps) {
  return (
    <ResizablePanelGroup direction="vertical" className="h-full min-h-0">
      <ResizablePanel defaultSize={50}>
        <EditorHeader actions={actions} />

        <Editor
          editorContent={fileContents[activeFile]}
          setEditorContent={setEditorContent}
          language={activeFile?.endsWith(".go") ? "go" : "markdown"}
          options={{ readOnly: resetting, minimap: { enabled: false } }}
        />

        {resetting && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Resetting to starter code...</span>
            </div>
          </div>
        )}
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* 4. Attach the ref passed from parent */}
      <ResizablePanel ref={terminalPanelRef} defaultSize={50}>
        <div className="h-full">
          <div className="h-full flex flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <TerminalOutput messages={messages} />
            </div>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
