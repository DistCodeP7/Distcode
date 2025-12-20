"use client";

import { cancelJobRequest, submitCode } from "@/app/exercises/[id]/actions";
import { EditorActions } from "@/app/exercises/[id]/components/editorActions";
import type { ExerciseEditorProps } from "@/app/exercises/[id]/components/editorProps";
import { EditorWithTerminalPanel } from "@/app/exercises/[id]/components/editorWithTerminalPanel";
import { ProblemSolutionPanel } from "@/app/exercises/[id]/components/problemSolutionPanel";
import { useExerciseFiles } from "@/app/exercises/[id]/components/useExerciseFiles";
import { ConfirmDialog } from "@/components/custom/confirmDialog";
import { FolderSystem } from "@/components/custom/folder-system/folderSystem";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useSSE } from "@/hooks/useSSE";
import type { Filemap } from "@/types/actionTypes";
import type { StreamingJobEvent } from "@/types/streamingEvents";
import { useRef, useState } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { toast } from "sonner";

export type JobStatus = {
  queueSize: number;
  activeWorkers: number;
} | null;

export default function ExerciseEditor({
  exerciseId,
  problemMarkdown,
  studentCode,
  solutionMarkdown,
  protocalCode,
  savedCode,
}: ExerciseEditorProps) {
  const initialContents: Filemap = savedCode ?? studentCode;
  const terminalRef = useRef<ImperativePanelHandle | null>(null);

  const { messages, connect, clearMessages } =
    useSSE<StreamingJobEvent>("/api/stream");

  const [currentJobUid, setCurrentJobUid] = useState<string | null>(null);

  const [jobStatus, setJobStatus] = useState<JobStatus>(null);

  const {
    file,
    setFile,
    reset,
    setReset,
    onCreateFile,
    onDeleteFile,
    onSave,
    onReset,
    confirmReset,
    setEditorContent,
    handleRate,
  } = useExerciseFiles({
    exerciseId,
    initialContents,
    studentCode,
  });

  const [canRate, setCanRate] = useState(true);

  const hasActiveJob =
    !!currentJobUid && !messages.some((msg) => msg.type === "result");

  const handleSubmit = async () => {
    clearMessages();
    connect();

    const problemContentMap: Filemap = {};
    file.order.forEach((p) => {
      problemContentMap[p] = file.content[p] ?? "";
    });

    const result = await submitCode(problemContentMap, {
      params: { id: exerciseId },
    });

    if (result.error) {
      toast.error("Failed to submit code", { description: result.error });
      return;
    }

    setCanRate(false);
    terminalRef.current?.resize(80);
    if (result?.jobUid) {
      setCurrentJobUid(result.jobUid);
      setJobStatus({
        queueSize: result.queueMetrics.messageCount,
        activeWorkers: result.queueMetrics.consumerCount,
      });
    }
  };

  const handleCancelTests = () => {
    if (!currentJobUid) return;
    cancelJobRequest(currentJobUid);
    setCurrentJobUid(null);
    setJobStatus(null);
  };

  const editorActions = (
    <EditorActions
      onSave={onSave}
      onSubmit={handleSubmit}
      onCancelTests={handleCancelTests}
      onReset={onReset}
      hasActiveJob={hasActiveJob}
      resetting={reset.resetting}
      canRate={canRate}
      onRate={handleRate}
    />
  );

  return (
    <>
      <ConfirmDialog
        open={reset.showResetDialog}
        onOpenChange={(open) =>
          setReset((prev) => ({ ...prev, showResetDialog: open }))
        }
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
        <ResizablePanel minSize={4} maxSize={20} defaultSize={12} collapsible>
          <div className="flex flex-col h-full overflow-auto">
            <FolderSystem
              files={file.content}
              sections={["student"]}
              onFileChange={(path) =>
                setFile((prev) => ({ ...prev, active: path }))
              }
              onCreateFile={onCreateFile}
              onDeleteFile={onDeleteFile}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle handleClassName="self-start mt-20" />

        {/* Panel 2: Problem / Solution */}
        <ResizablePanel
          minSize={10}
          defaultSize={35}
          collapsible
          className="overflow-y-auto"
        >
          <ProblemSolutionPanel
            problemMarkdown={problemMarkdown}
            protocolCode={protocalCode}
            solutionMarkdown={solutionMarkdown}
          />
        </ResizablePanel>

        <ResizableHandle withHandle handleClassName="self-start mt-60" />

        {/* Panel 3: Editor + Terminal */}
        <ResizablePanel minSize={30} defaultSize={50} collapsible>
          <EditorWithTerminalPanel
            terminalPanelRef={terminalRef}
            activeFile={file.active}
            fileContents={file.content}
            resetting={reset.resetting}
            setEditorContent={setEditorContent}
            messages={messages}
            actions={editorActions}
            exerciseId={exerciseId}
            jobStatus={jobStatus}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}
