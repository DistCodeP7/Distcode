import { notFound } from "next/navigation";
import { getExercise } from "@/app/exercises/[id]/actions";
import ClientCreateChallenge from "./ClientCreateChallenge";
import type { CheckoutFormState, Difficulty, Env } from "./challenge";

type SearchParams = {
  searchParams: Promise<{ id: string }>;
};

export default async function Page({ searchParams }: SearchParams) {
  const resolved = await searchParams;
  const idParam = resolved.id;
  const id = idParam ? parseInt(idParam, 10) : undefined;

  if (!id) return notFound();

  const exercise = await getExercise({ params: { id } });

  if (!exercise || "error" in exercise) return notFound();

  const testEnv = exercise.testEnvs as Env[];
  exercise.testEnvs = testEnv.map((env, index) => ({
    ...env,
    id: `test-env-${index}`,
  }));

  const globalEnv = exercise.globalEnvs as Env[];
  exercise.globalEnvs = globalEnv.map((env, index) => ({
    ...env,
    id: `global-env-${index}`,
  }));

  const replicaConfigs = exercise.replicaConfigs as {
    alias: string;
    envs: Env[];
  }[];
  exercise.replicaConfigs = replicaConfigs.map((replica, rIndex) => ({
    ...replica,
    envs: replica.envs.map((env, eIndex) => ({
      ...env,
      id: `replica-${rIndex}-env-${eIndex}`,
    })),
  }));

  const baseForm: CheckoutFormState = {
    step: 1,
    details: {
      title: exercise.title,
      description: exercise.description,
      difficulty: exercise.difficulty as Difficulty,
    },
    testContainer: {
      alias: exercise.testAlias,
      testFiles: exercise.testCode,
      buildCommand: exercise.testBuildCommand,
      entryCommand: exercise.testEntryCommand,
      envs: testEnv,
    },
    submission: {
      buildCommand: exercise.submissionBuildCommand,
      entryCommand: exercise.submissionEntryCommand,
      replicas: replicaConfigs.length,
      globalEnvs: globalEnv,
      replicaConfigs: replicaConfigs,
    },
  };

  return (
    <ClientCreateChallenge
      baseForm={baseForm}
      exerciseId={id}
      currentSelected={
        exercise.selectedTestPath ?? [Object.keys(exercise.testCode)]
      }
    />
  );
}
