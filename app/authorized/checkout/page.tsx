import { notFound } from "next/navigation";
import ClientCreateChallenge from "@/app/authorized/checkout/clientCreateChallenge";
import { getExercise } from "@/app/exercises/[id]/actions";
import type {
  CheckoutFormState,
  Difficulty,
  Env,
  SearchParams,
} from "@/types/challenge";

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
    id: number;
  }[];
  exercise.replicaConfigs = replicaConfigs.map((replica) => ({
    ...replica,
    envs: replica.envs.map((env, eIndex) => ({
      ...env,
      id: `${replica.alias}-env-${eIndex}`,
    })),
  }));

  const baseForm: CheckoutFormState = {
    step: 1,
    details: {
      title: exercise.title,
      description: exercise.description,
      difficulty: exercise.difficulty as Difficulty,
      timeout: exercise.timeout,
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
        exercise.selectedTestPath ?? Object.keys(exercise.testCode)
      }
    />
  );
}
