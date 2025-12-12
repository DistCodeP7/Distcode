import type { Filemap } from "@/types/actionTypes";

export type Env = { key: string; value: string; id: string };

export type TestContainerConfig = {
  alias: string;
  testFiles: Filemap;
  buildCommand: string;
  entryCommand: string;
  envs: Env[];
};

export type ReplicaConfig = {
  alias: string;
  envs: Env[];
  id: number;
};

export type SubmissionConfig = {
  buildCommand: string;
  entryCommand: string;
  globalEnvs: Env[];
  replicas: number;
  replicaConfigs: Record<number, ReplicaConfig>;
};

export type Difficulty = "Easy" | "Medium" | "Hard";

export type DetailsConfig = {
  title: string;
  description: string;
  difficulty: Difficulty | "";
  timeout: number;
};

export type CheckoutFormState = {
  step: number;
  details: DetailsConfig;
  testContainer: TestContainerConfig;
  submission: SubmissionConfig;
};

export type SearchParams = {
  searchParams: Promise<{ id: string }>;
};
