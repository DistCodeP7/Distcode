import type { SetStateAction } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
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
};

export type ExerciseEditorProps = {
  exerciseId: number;
  problemMarkdown: string;
  studentCode: Filemap;
  solutionCode: string;
  protocalCode: string;
  testCasesCode: Filemap;
  savedCode?: Filemap | null;
  canRate?: boolean;
};

type SolutionFile = {
  name: string;
  content: string;
};

export type ProblemSolutionPanelProps = {
  problemMarkdown: string;
  protocolCode: string;
  solutionFiles: SolutionFile[];
};

export type UseExerciseFilesArgs = {
  exerciseId: number;
  initialContents: Filemap;
  studentCode: Filemap;
  onBeforeSave?: () => void;
};
