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

type FailedTestSummary = { name: string; message: string };

const isStatusLike = (
  ev: unknown,
): ev is StatusEvent | (Omit<StatusEvent, "kind"> & { kind?: unknown }) => {
  if (!ev || typeof ev !== "object") return false;
  const anyEv = ev as any;
  if (anyEv.kind === "status") return true;
  return (
    typeof anyEv.status === "string" &&
    typeof anyEv.duration_millis === "number"
  );
};

export function TerminalOutput({ messages }: TerminalOutputProps) {
  const flattenedEvents: FlattenedEvent[] = messages.flatMap((msg, msgIndex) =>
    msg.events.map((event, evIndex) => ({
      event,
      key: `${msg.job_uid}-${msgIndex}-${evIndex}`,
    })),
  );

  const allEvents: StreamingEvent[] = flattenedEvents.map((f) => f.event);

  const statusEvent: StatusEvent | undefined = (() => {
    for (let i = allEvents.length - 1; i >= 0; i--) {
      const evAny = allEvents[i] as any;
      if (isStatusLike(evAny)) {
        if (evAny.kind === "status") {
          return evAny as StatusEvent;
        }
        return {
          kind: "status",
          status: evAny.status,
          message: evAny.message,
          duration_millis: evAny.duration_millis,
          failed_worker_id: evAny.failed_worker_id,
          test_results: evAny.test_results,
        } as StatusEvent;
      }
    }
    return undefined;
  })();

  const compiledEvent: CompiledEvent | undefined = (() => {
    for (let i = allEvents.length - 1; i >= 0; i--) {
      const ev = allEvents[i] as any;
      if (ev.kind === "compiled") return ev as CompiledEvent;
    }
    return undefined;
  })();

  const logEvents: LogEvent[] = allEvents.filter(
    (e): e is LogEvent => (e as any).kind === "log",
  );

  const errorFromEvents: string | undefined = (() => {
    for (let i = allEvents.length - 1; i >= 0; i--) {
      const evAny = allEvents[i] as any;
      if (typeof evAny.error === "string") {
        const trimmed = evAny.error.trim();
        if (trimmed !== "") return trimmed;
      }
    }
    return undefined;
  })();

  const filteredLogEvents = logEvents.filter(
    (ev) =>
      ev.message &&
      ev.message.trim() !== "Connected to stream." &&
      ev.message.trim() !== "",
  );

  const passedTestsFromResults =
    statusEvent?.test_results
      ?.filter((tr) => tr.type === "success")
      .map((tr) => tr.name)
      .filter(Boolean) ?? [];

  const failedTestsFromResults: FailedTestSummary[] =
    statusEvent?.test_results
      ?.filter((tr) => tr.type !== "success")
      .map((tr) => ({
        name: tr.name,
        message: tr.message || tr.panic || "Test failed",
      }))
      .filter((t) => !!t.name) ?? [];

  const passedTests = passedTestsFromResults;
  const failedTests = failedTestsFromResults;

  const hasFail = failedTests.length > 0;

  let totalTests = 0;
  let passedCount = 0;
  let failedCount = 0;

  if (statusEvent?.test_results?.length) {
    totalTests = statusEvent.test_results.length;
    passedCount = statusEvent.test_results.filter(
      (tr) => tr.type === "success",
    ).length;
    failedCount = totalTests - passedCount;
  }

  const { status: rawStatus, statusLabel: rawStatusLabel } =
    computeStatusAndLabel({
      allEventsLength: allEvents.length,
      totalTests,
      passedCount,
      failedCount,
      compiledEvent,
      hasFailLogLine: hasFail,
    });

  const hasCompilationError = statusEvent?.status === "JOB_COMPILATION_ERROR";

  // Detailed message to show inside the terminal body
  const compilationErrorText =
    (hasCompilationError && errorFromEvents) ||
    statusEvent?.message ||
    "Compilation error";

  const status = hasCompilationError ? "all_failed" : rawStatus;

  // 🔴 Bar text: generic
  const statusLabel = hasCompilationError
    ? "Compilation failed"
    : rawStatusLabel;

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

  return (
    <div className="flex w-full flex-col gap-2 text-sm font-mono">
      <div
        className={`flex w-full items-center gap-2 rounded-md border px-2 py-1 text-xs ${statusClass}`}
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

      <div className="max-h-64 overflow-auto rounded-md p-2 text-xs text-slate-100">
        {hasCompilationError && (
          <div className="mb-1 text-red-400">{compilationErrorText}</div>
        )}

        {!hasCompilationError && rawStatus === "running" && (
          <div className="mb-1 text-slate-100">Running...</div>
        )}

        {filteredLogEvents.map((ev, idx) => (
          <div key={idx} className="whitespace-pre-wrap">
            {ev.message}
          </div>
        ))}

        {failedTests.map((t) => (
          <div key={t.name} className="mt-2">
            {t.name}: {t.message}
          </div>
        ))}

        {rawStatus !== "running" &&
          !hasCompilationError &&
          failedTests.length === 0 &&
          filteredLogEvents.length === 0 && (
            <div className="text-slate-500">No output yet.</div>
          )}
      </div>
    </div>
  );
}
