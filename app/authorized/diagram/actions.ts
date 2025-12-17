"use server";

import { asc, desc, eq, getTableColumns } from "drizzle-orm";
import { job_process_messages, job_results, problems } from "@/drizzle/schema";
import { db } from "@/lib/db";
import type { JobInfo } from "./page";

export async function getTraceDataAction(jobUid: string) {
  try {
    const rawData = await db
      .select()
      .from(job_process_messages)
      .where(eq(job_process_messages.jobUid, jobUid))
      .orderBy(asc(job_process_messages.timestamp));

    // Transform BigInt Nanoseconds -> Number Milliseconds
    // JS Number max safe integer is 2^53. 19-digit nanoseconds exceed this.
    // If your schema uses { mode: "number" }, you might already have precision loss.
    // Ideally, use { mode: "bigint" } in schema, but we handle it here:

    const serializedData = rawData.map((row) => {
      // 1. Safe Timestamp Conversion (Nanoseconds to Milliseconds)
      // If row.timestamp is BigInt, divide by 1,000,000n
      // If row.timestamp is Number, divide by 1,000,000
      let timeInMs: number;

      try {
        // Assuming input is high-precision nanoseconds
        const bigTime = BigInt(row.timestamp);
        timeInMs = Number(bigTime / 1_000_000n);
      } catch (_e) {
        // Fallback if it's already a number
        timeInMs = Number(row.timestamp) / 1_000_000;
      }

      return {
        ...row,
        // Drizzle might return a BigInt object for ID or Timestamp,
        // which cannot be passed to Client Components directly.
        timestamp: timeInMs,
        // Ensure payload/clock are objects (Drizzle 'json' type handles this, but just to be safe)
        vector_clock:
          typeof row.vector_clock === "string"
            ? JSON.parse(row.vector_clock)
            : row.vector_clock,
        payload:
          typeof row.payload === "string"
            ? JSON.parse(row.payload)
            : row.payload,
      };
    });

    return { success: true, data: serializedData };
  } catch (error) {
    console.error("Failed to fetch trace:", error);
    return { success: false, error: "Failed to fetch trace data" };
  }
}

export async function getExerciseJobUid(userid: string) {
  if (!userid) return [];

  const result = await db
    .selectDistinctOn([job_results.userId, job_results.problemId], {
      ...getTableColumns(job_results),
    })
    .from(job_results)
    .where(eq(job_results.userId, userid))
    .orderBy(
      job_results.userId,
      job_results.problemId,
      desc(job_results.queued_at)
    );

  const jobUidMessageResult = await db
    .select({ jobUid: job_process_messages.jobUid })
    .from(job_process_messages)
    .groupBy(job_process_messages.jobUid);

  const exercises = await db.select().from(problems);

  const jobUids: JobInfo[] = [];

  result.forEach((job) => {
    if (jobUidMessageResult.some((item) => item.jobUid === job.jobUid)) {
      jobUids.push({
        jobUid: job.jobUid,
        exerciseId: job.problemId,
        exerciseTitle:
          exercises.find((ex) => ex.id === job.problemId)?.title ||
          "Untitled Exercise",
      });
    }
  });

  return jobUids;
}
