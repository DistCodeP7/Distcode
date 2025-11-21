import React from "react";

type StreamingEvent = {
  Kind: "stdout" | "stderr" | "error" | "cancel" | "metric";
  Message?: string;
  WorkerMetric?: {
    StartTime: string;
    EndTime: string;
    DeltaTime: string;
  };
};

type StreamingJobMessage = {
  JobId?: number;
  job_uid?: string;
  ProblemId?: number;
  SequenceIndex: number;
  Events?: StreamingEvent[];
  UserId?: string | number;
};

type TerminalOutputProps = {
  messages: StreamingJobMessage[];
};

export function TerminalOutput({ messages }: TerminalOutputProps) {
  // Flatten messages into individual events tagged with job + seq
  const flattenedEvents = messages.flatMap((msg) =>
    (msg.Events ?? []).map((event) => ({
      event,
      jobId: msg.JobId ?? msg.job_uid,
      sequenceIndex: msg.SequenceIndex,
    })),
  );

  // All stdout events (useful for parsing test output)
  const stdoutEvents = flattenedEvents.filter(
    ({ event }) => event.Kind === "stdout" && !!event.Message,
  );

  // ---- Extract passed test names ----
  const passedTests = stdoutEvents
    .filter(({ event }) => event.Message!.includes("--- PASS:"))
    .map(({ event }) => {
      const line = event.Message!;
      const marker = "--- PASS:";
      const idx = line.indexOf(marker);
      if (idx === -1) return null;
      const after = line.slice(idx + marker.length).trim();
      const [name] = after.split(/\s+/);
      return name || null;
    })
    .filter((name): name is string => !!name);

  // ---- Derive overall status ----
  const hasFinalChunk = messages.some((m) => m.SequenceIndex === -1);

  const hasErrorEvent = flattenedEvents.some(
    ({ event }) => event.Kind === "error",
  );

  const hasFailLine = stdoutEvents.some(({ event }) => {
    const m = event.Message!.toLowerCase();
    return m.includes("fail") && !m.includes("debug");
  });

  let status: "idle" | "running" | "passed" | "failed" = "idle";
  if (flattenedEvents.length === 0) {
    status = "idle";
  } else if (hasErrorEvent || hasFailLine) {
    status = "failed";
  } else if (hasFinalChunk) {
    status = "passed";
  } else {
    status = "running";
  }

  // Map status to text / colour
  const statusLabel =
    status === "passed"
      ? "All tests passed"
      : status === "failed"
        ? "Tests failed"
        : status === "running"
          ? "Running tests..."
          : "Idle";

  const statusClass =
    status === "passed"
      ? "text-green-500 border-green-500 bg-green-500/10"
      : status === "failed"
        ? "text-red-500 border-red-500 bg-red-500/10"
        : status === "running"
          ? "text-yellow-500 border-yellow-500 bg-yellow-500/10"
          : "text-slate-400 border-slate-500 bg-slate-800/40";

  return (
    <div className="flex flex-col gap-2 text-sm font-mono">
      {/* Status badge */}
      <div
        className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${statusClass}`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            status === "passed"
              ? "bg-green-500"
              : status === "failed"
                ? "bg-red-500"
                : status === "running"
                  ? "bg-yellow-500"
                  : "bg-slate-400"
          }`}
        />
        <span>{statusLabel}</span>
      </div>

      {/* Passed tests list (only when everything passed and we have names) */}
      {status === "passed" && passedTests.length > 0 && (
        <div className="rounded-md border border-green-500/50 bg-green-500/5 p-2 text-xs text-green-400">
          <div className="mb-1 font-semibold">Passed tests</div>
          <ul className="list-disc pl-4">
            {passedTests.map((name, idx) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw terminal lines */}
      <div className="max-h-64 overflow-auto rounded-md bg-black/80 p-2 text-xs text-slate-100">
        {flattenedEvents.length === 0 ? (
          <div className="text-slate-500">No output yet.</div>
        ) : (
          flattenedEvents.map(({ event, sequenceIndex }, idx) => (
            <div
              key={`${sequenceIndex}-${idx}`}
              className={
                event.Kind === "stderr" || event.Kind === "error"
                  ? "text-red-400"
                  : "text-slate-100"
              }
            >
              {event.Message ?? ""}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
