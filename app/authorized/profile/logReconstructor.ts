import type { TResults } from "@/drizzle/schema";
import type {
  LogEventPayload,
  ResultEventPayload,
  StreamingJobEvent,
} from "@/types/streamingEvents";
export function reconstructStreamEvents(result: TResults): StreamingJobEvent[] {
  const events: StreamingJobEvent[] = [];
  const baseInfo = {
    job_uid: result.jobUid,
    user_id: result.userId,
  };

  if (result.logs && Array.isArray(result.logs)) {
    (result.logs as LogEventPayload[]).forEach((log) => {
      events.push({
        ...baseInfo,
        type: "log",
        log: log,
      });
    });
  }

  if (result.outcome) {
    const resultPayload: ResultEventPayload = {
      outcome: result.outcome,
      duration_ms: result.duration || 0,
      test_results: result.test_results || [],
    };

    events.push({
      ...baseInfo,
      type: "result",
      result: resultPayload,
    });
  }

  return events;
}
