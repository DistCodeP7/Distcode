export type fullPayload = {
  jobUid: string;
  nodes: ContainerConfigs;
  userId: string;
  timeout: number;
  submittedAt: Date;
};

export type ContainerConfigs = {
  testContainer: TestContainerConfig;
  submission: SubmissionConfig;
};

export type SubmissionConfig = {
  submissionCode: Filemap;
  buildCommand: string;
  entryCommand: string;
  globalEnvs: newEnv[];
  replicaConfigs: newReplicaConfig[];
};

export type TestContainerConfig = {
  alias: string;
  testFiles: Filemap;
  buildCommand: string;
  entryCommand: string;
  envs: newEnv[];
};

type newReplicaConfig = {
  alias: string;
  envs: newEnv[];
};

export type Filemap = {
  [key: string]: string;
};

type newEnv = { key: string; value: string };
