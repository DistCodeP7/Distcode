"use client";

import { useState } from "react";
import type { Paths } from "@/drizzle/schema";
import type { Filemap } from "@/app/exercises/[id]/actions";
import { cancelJobRequest, submitCode } from "@/app/exercises/[id]/actions";
import { ConfirmDialog } from "@/components/custom/confirmDialog";
import { FolderSystem } from "@/components/custom/folder-system/FolderSystem";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useSSE } from "@/hooks/useSSE";
import type { StreamingJobEvent } from "@/types/streamingEvents";
import { useExerciseFiles } from "./useExerciseFiles";
import { EditorActions } from "./EditorActions";
import { ProblemSolutionPanel } from "./ProblemSolutionPanel";
import { EditorWithTerminalPanel } from "./EditorWithTerminalPanel";

type ExerciseEditorProps = {
  exerciseId: number;
  problemMarkdown: string;
  studentCode: Paths;
  solutionCode: string;
  protocalCode: string;
  testCasesCode: Paths;
  savedCode?: Paths | null;
  userRating?: "up" | "down" | null;
  canRate?: boolean;
};

export default function ExerciseEditor({
  exerciseId,
  problemMarkdown,
  studentCode,
  testCasesCode,
  solutionCode,
  protocalCode,
  savedCode,
}: ExerciseEditorProps) {
  const initialContents: Paths = savedCode ?? studentCode;

  const { messages, connect, clearMessages } =
    useSSE<StreamingJobEvent>("/api/stream");

  const [currentJobUid, setCurrentJobUid] = useState<string | null>(null);

  const {
    fileContents,
    fileOrder,
    activeFile,
    setActiveFile,
    resetting,
    showResetDialog,
    setShowResetDialog,
    onCreateFile,
    onDeleteFile,
    onSave,
    onReset,
    confirmReset,
    setEditorContent,
  } = useExerciseFiles({
    exerciseId,
    initialContents,
    studentCode,
    onBeforeSave: clearMessages,
  });

  const solutionFiles = solutionCode
    ? [{ name: "main.go", content: solutionCode }]
    : [];

  const allOtherFiles: Filemap = {
    ...testCasesCode,
    "/protocol/protocol.go": protocalCode,
  };

  // Job is considered "active" while we have a job UID
  // and NO result event has appeared in the stream yet.
  const hasActiveJob =
    !!currentJobUid && !messages.some((msg) => msg.type === "result");

  const handleSubmit = async () => {
    clearMessages();
    connect();

    const _allFiles: Filemap = { ...allOtherFiles };
    fileOrder.forEach((path) => {
      _allFiles[path] = fileContents[path];
    });

    const problemContentMap: Filemap = {};
    fileOrder.forEach((p) => {
      problemContentMap[p] = fileContents[p] ?? "";
    });

    const result = await submitCode(problemContentMap, {
      params: { id: exerciseId },
    });

    if (result?.jobUid) {
      setCurrentJobUid(result.jobUid);
    }
  };

  const handleCancelTests = () => {
    if (!currentJobUid) return;
    cancelJobRequest(currentJobUid);
    setCurrentJobUid(null);
  };

  const editorActions = (
    <EditorActions
      onSave={onSave}
      onSubmit={handleSubmit}
      onCancelTests={handleCancelTests}
      onReset={onReset}
      hasActiveJob={hasActiveJob}
      resetting={resetting}
    />
  );

  return (
    <>
      <ConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset Code?"
        description="Are you sure you want to reset your code? This will remove your saved progress and restore the original template."
        confirmLabel="Reset"
        onConfirm={confirmReset}
      />

      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 border md:min-w-[450px] overflow-x-hidden"
      >
        {/* Panel 1: Folder System */}
        <ResizablePanel minSize={4} maxSize={20} defaultSize={15} collapsible>
          <div className="flex flex-col h-full overflow-auto">
            <FolderSystem
              files={fileContents}
              sections={["student"]}
              onFileChange={setActiveFile}
              onCreateFile={onCreateFile}
              onDeleteFile={onDeleteFile}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle handleClassName="self-start mt-20" />

        {/* Panel 2: Problem / Solution */}
        <ResizablePanel
          minSize={5}
          defaultSize={35}
          collapsible
          className="overflow-y-auto"
        >
          <ProblemSolutionPanel
            problemMarkdown={problemMarkdown}
            protocolCode={protocalCode}
            solutionFiles={solutionFiles}
          />
        </ResizablePanel>

        <ResizableHandle withHandle handleClassName="self-start mt-60" />

        {/* Panel 3: Editor + Terminal */}
        <ResizablePanel minSize={30} defaultSize={50} collapsible>
          <EditorWithTerminalPanel
            activeFile={activeFile}
            fileContents={fileContents}
            resetting={resetting}
            setEditorContent={setEditorContent}
            messages={messages}
            actions={editorActions}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}
