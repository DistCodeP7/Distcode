import type { Paths } from "@/drizzle/schema";

type NewEnv = { key: string; value: string };
type NewReplicaConfig = { alias: string; envs: NewEnv[] };
export type NewProblem = {
  userId: string;
  problemMarkdown: string;
  studentCode: Paths;
  solutionCode: string;
  protocolCode: Paths;
  testCode: Paths;
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
  studentCode: Paths;
  solutionCode: string;
  testCode: Paths;
  protocolCode: Paths;
  isPublished?: boolean;
};
