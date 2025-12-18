import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DiagramClient from "@/app/authorized/diagram/components/diagramClient";
import type { JobInfo } from "@/app/authorized/diagram/components/traceHeaderCard";
import type { TJob_Process_Messages } from "@/drizzle/schema";
import { getExerciseJobUid, getTraceDataAction } from "./actions";

export default async function SpaceTimeDiagramPage({
  searchParams,
}: {
  searchParams: { exerciseId?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth"); // adjust to your sign-in route

  const jobs = (await getExerciseJobUid(session.user.id)) as JobInfo[];

  const initialExerciseId = searchParams.exerciseId ?? "";
  const initialJob =
    jobs.find((j) => j.exerciseId.toString() === initialExerciseId) ?? jobs[0];

  let initialEvents: TJob_Process_Messages[] = [];
  if (initialJob?.jobUid) {
    const trace = await getTraceDataAction(initialJob.jobUid);
    if (trace.success && trace.data) {
      initialEvents = trace.data as TJob_Process_Messages[];
    }
  }

  return (
    <DiagramClient
      userId={session.user.id}
      initialJobs={
        jobs.length
          ? jobs
          : [{ jobUid: "none", exerciseId: -1, exerciseTitle: "No jobs found" }]
      }
      initialJob={
        initialJob ?? {
          jobUid: "none",
          exerciseId: -1,
          exerciseTitle: "No jobs found",
        }
      }
      initialEvents={initialEvents}
    />
  );
}
