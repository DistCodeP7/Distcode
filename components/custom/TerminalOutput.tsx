import type React from "react";
import type {
  CompiledEvent,
  LogEvent,
  StatusEvent,
  StreamingEvent,
  StreamingJobMessage,
} from "@/types/streamingEvents";

type TerminalOutputProps = {
  messages: StreamingJobMessage[];
};

type FlattenedEvent = {
  event: StreamingEvent;
  key: string;
};

export function TerminalOutput({ messages }: TerminalOutputProps) {
  // Flatten events but keep a stable key derived from job + position
  const flattenedEvents: FlattenedEvent[] = messages.flatMap((msg, msgIndex) =>
    msg.events.map((event, evIndex) => ({
      event,
      key: `${msg.job_uid}-${msgIndex}-${evIndex}`,
    }))
  );

  const allEvents: StreamingEvent[] = flattenedEvents.map((f) => f.event);

  // ---------- classify / extract ----------
  const logEvents: LogEvent[] = allEvents.filter(
    (e): e is LogEvent => e.kind === "log"
  );

  const passedTests = logEvents
    .map((e) => e.message)
    .filter((line) => line.includes("--- PASS:"))
    .map((line) => {
      const marker = "--- PASS:";
      const idx = line.indexOf(marker);
      if (idx === -1) return null;
      const after = line.slice(idx + marker.length).trim();
      const [name] = after.split(/\s+/);
      return name || null;
    })
    .filter((name): name is string => !!name);

  const statusEvent: StatusEvent | undefined = (() => {
    for (let i = allEvents.length - 1; i >= 0; i--) {
      const ev = allEvents[i];
      if (ev.kind === "status") return ev as StatusEvent;
    }
    return undefined;
  })();

  const compiledEvent: CompiledEvent | undefined = (() => {
    for (let i = allEvents.length - 1; i >= 0; i--) {
      const ev = allEvents[i];
      if (ev.kind === "compiled") return ev as CompiledEvent;
    }
    return undefined;
  })();

  const hasFailLogLine = logEvents.some((ev) => {
    const m = ev.message.toLowerCase();
    return m.includes("fail") || m.includes("panic");
  });

  // ---------- derive overall status ----------
  let status: "idle" | "running" | "passed" | "failed";

  if (allEvents.length === 0) {
    status = "idle";
  } else if (statusEvent) {
    status = statusEvent.status === "JOB_SUCCESS" ? "passed" : "failed";
  } else if (compiledEvent && !compiledEvent.success) {
    status = "failed";
  } else if (hasFailLogLine) {
    status = "failed";
  } else {
    status = "running";
  }

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

  const renderLine = (event: StreamingEvent): React.ReactNode => {
    switch (event.kind) {
      case "log": {
        const e = event as LogEvent;
        return e.message;
      }
      case "compiled": {
        const e = event as CompiledEvent;
        const base = e.success ? "Compilation succeeded" : "Compilation failed";
        const err = e.error ? `: ${e.error}` : "";
        return `${base}${err}`;
      }
      case "status": {
        const e = event as StatusEvent;
        const extra = e.message ? ` - ${e.message}` : "";
        return `Job status: ${e.status} (${e.duration_millis} ms)${extra}`;
      }
      default: {
        return JSON.stringify(event);
      }
    }
  };

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

      {/* Passed tests */}
      {status === "passed" && passedTests.length > 0 && (
        <div className="rounded-md border border-green-500/50 bg-green-500/5 p-2 text-xs text-green-400">
          <div className="mb-1 font-semibold">Passed tests</div>
          <ul className="list-disc pl-4">
            {passedTests.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw output */}
      <div className="max-h-64 overflow-auto rounded-md bg-black/80 p-2 text-xs text-slate-100">
        {flattenedEvents.length === 0 ? (
          <div className="text-slate-500">No output yet.</div>
        ) : (
          flattenedEvents.map(({ event, key }) => (
            <div key={key} className="text-slate-100">
              {renderLine(event)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
