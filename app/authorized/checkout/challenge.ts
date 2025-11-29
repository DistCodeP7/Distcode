export type Env = { key: string; value: string; id: string };

export type TestContainerConfig = {
  alias: string;
  testFiles: string[];
  buildCommand: string;
  entryCommand: string;
  envs: Env[];
};

export type ReplicaConfig = {
  alias: string;
  envs: Env[];
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
