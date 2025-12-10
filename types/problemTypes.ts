import type { Filemap } from "@/types/actionTypes";

type NewEnv = { key: string; value: string };
type NewReplicaConfig = { alias: string; envs: NewEnv[] };
export type NewProblem = {
  userId: string;
  problemMarkdown: string;
  studentCode: Filemap;
  solutionMarkdown: string;
  protocolCode: Filemap;
  testCode: Filemap;
  isPublished?: boolean;
  title: string;
  description: string;
  difficulty: string;
  testAlias: string;
  selectedTestPath: string[];
  testBuildCommand: string;
  testEntryCommand: string;
  testEnvs: NewEnv[];
  submissionBuildCommand: string;
  submissionEntryCommand: string;
  globalEnvs: NewEnv[];
  replicaConfigs: NewReplicaConfig[];
  timeout: number;
};

export type ActionResult =
  | { success: true; message?: string; status?: number; id?: number }
  | { success: false; error?: string; status?: number };
export type SaveProblemParams = {
  id?: number;
  problemMarkdown: string;
  studentCode: Filemap;
  solutionMarkdown: string;
  testCode: Filemap;
  protocolCode: Filemap;
  isPublished?: boolean;
};
