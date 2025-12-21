import type { SetStateAction } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import type { JobStatus } from "@/app/exercises/[id]/components/exerciseEditor";
import type { Filemap } from "@/types/actionTypes";
import type { StreamingJobEvent } from "@/types/streamingEvents";

export type EditorWithTerminalPanelProps = {
  activeFile: string;
  fileContents: Filemap;
  resetting: boolean;
  setEditorContent: (value: SetStateAction<string>) => void;
  messages: StreamingJobEvent[];
  actions: React.ReactNode;
  terminalPanelRef: React.RefObject<ImperativePanelHandle | null>;
  exerciseId: number;
  jobStatus?: JobStatus;
};

export type ExerciseEditorProps = {
  exerciseId: number;
  problemMarkdown: string;
  studentCode: Filemap;
  solutionMarkdown: string;
  protocalCode: string;
  testCasesCode: Filemap;
  savedCode?: Filemap | null;
  canRate?: boolean;
};

export type ProblemSolutionPanelProps = {
  problemMarkdown: string;
  protocolCode: string;
  solutionMarkdown: string;
};

export type UseExerciseFilesArgs = {
  exerciseId: number;
  initialContents: Filemap;
  studentCode: Filemap;
  onBeforeSave?: () => void;
};
