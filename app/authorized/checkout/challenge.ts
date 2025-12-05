import type { Paths } from "@/drizzle/schema";

export type Env = { key: string; value: string; id: string };

export type TestContainerConfig = {
  alias: string;
  testFiles: Paths;
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
};

export type CheckoutFormState = {
  step: number;
  details: DetailsConfig;
  testContainer: TestContainerConfig;
  submission: SubmissionConfig;
};
