export type Phase = "PENDING" | "COMPILING" | "RUNNING" | "COMPLETED";

export type JobEventType = "log" | "status" | "result";

export type Outcome =
  | "SUCCESS"
  | "FAILED"
  | "COMPILATION_ERROR"
  | "TIMEOUT"
  | "CANCELED";

export type TestResultType = "success" | "failure" | "panic";

export type TestResult = {
  type: TestResultType;
  name: string;
  duration_ms: number;
  message: string;
  panic?: string;
};

// 1. Log Payload
export type LogEventPayload = {
  worker_id: string;
  phase: Phase;
  message: string;
};

// 2. Status Payload
export type StatusEventPayload = {
  phase: Phase;
  message: string;
};

// 3. Result Payload
export type ResultEventPayload = {
  outcome: Outcome;
  duration_ms: number;
  test_results?: TestResult[];
  failed_worker_id?: string;
  error?: string;
};

// The Envelope (Discriminated Union)
// This strictly matches your Go 'StreamingJobEvent' JSON output
export type StreamingJobEvent =
  | {
      job_uid: string;
      user_id: string;
      type: "log";
      log: LogEventPayload; // strictly required if type is log
      status?: never;
      result?: never;
    }
  | {
      job_uid: string;
      user_id: string;
      type: "status";
      log?: never;
      status: StatusEventPayload; // strictly required if type is status
      result?: never;
    }
  | {
      job_uid: string;
      user_id: string;
      type: "result";
      log?: never;
      status?: never;
      result: ResultEventPayload; // strictly required if type is result
    };
