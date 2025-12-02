// ----- Job status -----

export type JobStatus =
  | "JOB_SUCCESS"
  | "JOB_FAILED"
  | "JOB_TIMEOUT"
  | "JOB_COMPILATION_ERROR"
  | "JOB_CANCELED";

// ----- Event types matching your Go code -----

export type CompiledEvent = {
  kind: "compiled";
  success: boolean;
  failed_worker_id?: string;
  error?: string;
};

export type LogEvent = {
  kind: "log";
  worker_id?: string;
  message: string;
};

export type StatusEvent = {
  kind: "status";
  status: JobStatus;
  message?: string;
  duration_millis: number;
  failed_worker_id?: string;
};

export type StreamingEvent = CompiledEvent | LogEvent | StatusEvent;

// One job message = what your Go worker sends
export type StreamingJobMessage = {
  job_uid: string;
  events: StreamingEvent[];
  user_id: string;
};
