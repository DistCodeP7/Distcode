import type React from "react";
import type {
  CompiledEvent,
  LogEvent,
  StatusEvent,
  StreamingEvent,
  StreamingJobMessage,
} from "@/types/streamingEvents";
import { computeStatusAndLabel } from "@/utils/terminalStatus";

type TerminalOutputProps = {
  messages: StreamingJobMessage[];
};

type FlattenedEvent = {
  event: StreamingEvent;
  key: string;
};

type FailedTestSummary = { name: string };

export function TerminalOutput({ messages }: TerminalOutputProps) {
  const flattenedEvents: FlattenedEvent[] = messages.flatMap((msg, msgIndex) =>
    msg.events.map((event, evIndex) => ({
      event,
      key: `${msg.job_uid}-${msgIndex}-${evIndex}`,
    })),
  );

  const allEvents: StreamingEvent[] = flattenedEvents.map((f) => f.event);

  const logEvents: LogEvent[] = allEvents.filter(
    (e): e is LogEvent => e.kind === "log",
  );

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

  const passedTestsFromResults =
    statusEvent?.test_results
      ?.filter((tr) => tr.type.toLowerCase() === "success")
      .map((tr) => tr.name)
      .filter(Boolean) ?? [];

  const failedTestsFromResults: FailedTestSummary[] =
    statusEvent?.test_results
      ?.filter((tr) => tr.type.toLowerCase() !== "success")
      .map((tr) => ({ name: tr.name }))
      .filter((t) => !!t.name) ?? [];

  const passedTestsFromLogs = logEvents
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

  const failedTestsFromLogs: FailedTestSummary[] = logEvents
    .map((e) => e.message)
    .filter((line) => line.includes("--- FAIL:"))
    .map((line) => {
      const marker = "--- FAIL:";
      const idx = line.indexOf(marker);
      if (idx === -1) return null;
      const after = line.slice(idx + marker.length).trim();
      const [name] = after.split(/\s+/);
      return name || null;
    })
    .filter((name): name is string => !!name)
    .map((name) => ({ name }));

  const passedTests =
    passedTestsFromResults.length > 0
      ? passedTestsFromResults
      : passedTestsFromLogs;

  const failedTests: FailedTestSummary[] =
    failedTestsFromResults.length > 0
      ? failedTestsFromResults
      : failedTestsFromLogs;

  const hasFailLogLine =
    failedTests.length > 0 ||
    logEvents.some((ev) => {
      const m = ev.message.toLowerCase();
      return m.includes("fail") || m.includes("panic");
    });

  let totalTests = 0;
  let passedCount = 0;
  let failedCount = 0;

  if (statusEvent?.test_results?.length) {
    totalTests = statusEvent.test_results.length;
    passedCount = statusEvent.test_results.filter(
      (tr) => tr.type.toLowerCase() === "success",
    ).length;
    failedCount = totalTests - passedCount;
  } else if (passedTests.length || failedTests.length) {
    passedCount = passedTests.length;
    failedCount = failedTests.length;
    totalTests = passedCount + failedCount;
  }

  const { status, statusLabel } = computeStatusAndLabel({
    allEventsLength: allEvents.length,
    totalTests,
    passedCount,
    failedCount,
    compiledEvent,
    hasFailLogLine,
  });

  const statusClass =
    status === "all_passed"
      ? "text-green-500 border-green-500 bg-green-500/10"
      : status === "all_failed"
        ? "text-red-500 border-red-500 bg-red-500/10"
        : status === "some_passed"
          ? "text-amber-400 border-amber-500 bg-amber-500/10"
          : status === "running"
            ? "text-yellow-500 border-yellow-500 bg-yellow-500/10"
            : "text-slate-400 border-slate-500 bg-slate-800/40";

  const dotClass =
    status === "all_passed"
      ? "bg-green-500"
      : status === "all_failed"
        ? "bg-red-500"
        : status === "some_passed"
          ? "bg-amber-400"
          : status === "running"
            ? "bg-yellow-500"
            : "bg-slate-400";

  const renderTestResultLines = (e: StatusEvent) =>
    (e.test_results ?? []).map((tr, idx) => {
      const duration =
        tr.duration_ms !== undefined ? `${tr.duration_ms}ms` : "";
      const message = tr.message ?? "";
      const panic = tr.panic ?? "";
      const line = `Test Result - Name: ${tr.name}, Type: ${tr.type}, Duration: ${duration}, Message: ${message}, Panic: ${panic}`;
      return <div key={idx}>{line}</div>;
    });

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
        const header = `Job status: ${e.status} (${e.duration_millis} ms)${extra}`;
        const testLines = renderTestResultLines(e);
        if (testLines.length === 0) return header;
        return (
          <>
            <div>{header}</div>
            {testLines}
          </>
        );
      }
      default: {
        return JSON.stringify(event);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 text-sm font-mono">
      <div
        className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${statusClass}`}
      >
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span>{statusLabel}</span>
      </div>

      {(passedTests.length > 0 || failedTests.length > 0) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {passedTests.length > 0 && (
            <div className="flex-1 rounded-md border border-green-500/50 bg-green-500/5 p-2 text-xs text-green-400">
              <div className="mb-1 font-semibold">Passed tests</div>
              <ul className="list-disc pl-4">
                {passedTests.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          )}

          {failedTests.length > 0 && (
            <div className="flex-1 rounded-md border border-red-500/50 bg-red-500/5 p-2 text-xs text-red-400">
              <div className="mb-1 font-semibold">Failed tests</div>
              <ul className="list-disc pl-4">
                {failedTests.map((t) => (
                  <li key={t.name}>{t.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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
