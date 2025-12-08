import type {
  Outcome,
  Phase,
  ResultEventPayload,
  StreamingJobEvent,
  TestResult,
} from "@/types/streamingEvents";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Terminal,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

type ViewMode = "CONSOLE" | "TESTS";

const getStatusConfig = (phase: Phase, outcome?: Outcome) => {
  if (phase === "DEBUGGING")
    return {
      label: "Debugging",
      color: "bg-yellow-500 animate-pulse",
      text: "text-yellow-500",
    };
  if (phase === "PENDING")
    return {
      label: "Pending",
      color: "bg-muted-foreground",
      text: "text-muted-foreground",
    };
  if (phase === "COMPILING" || phase === "RUNNING")
    return {
      label: phase === "COMPILING" ? "Compiling" : "Running",
      color: "bg-primary animate-pulse",
      text: "text-primary",
    };

  switch (outcome) {
    case "SUCCESS":
      return {
        label: "Passed",
        color: "bg-[var(--chart-2)]",
        text: "text-[var(--chart-2)]",
      };
    case "FAILED":
      return {
        label: "Failed",
        color: "bg-destructive",
        text: "text-destructive",
      };
    case "COMPILATION_ERROR":
      return {
        label: "Build Error",
        color: "bg-destructive",
        text: "text-destructive",
      };
    case "TIMEOUT":
      return {
        label: "Timed Out",
        color: "bg-orange-500",
        text: "text-orange-500",
      };
    case "CANCELED":
      return {
        label: "Canceled",
        color: "bg-muted-foreground",
        text: "text-muted-foreground",
      };
    default:
      return {
        label: "Done",
        color: "bg-muted-foreground",
        text: "text-muted-foreground",
      };
  }
};

export function useTerminalController(messages: StreamingJobEvent[]) {
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [userOverride, setUserOverride] = useState<ViewMode | null>(null);

  // --- 1. Aggregation Logic (Runs on every render) ---
  let currentPhase: Phase = "PENDING";
  const logs: Array<{ phase: Phase; message: string; workerId?: string }> = [];
  let finalResult: ResultEventPayload | null = null;
  const workerIds = new Set<string>();

  for (const msg of messages) {
    if (msg.type === "status") {
      currentPhase = msg.status.phase;
    } else if (msg.type === "log") {
      logs.push({ ...msg.log, workerId: msg.log.worker_id });
      currentPhase = msg.log.phase;
      if (msg.log.worker_id) workerIds.add(msg.log.worker_id);
    } else if (msg.type === "result") {
      currentPhase = "COMPLETED";
      finalResult = msg.result;
    }
  }

  // --- 2. Derived Data ---
  const uniqueWorkers = Array.from(workerIds).sort();
  const config = getStatusConfig(currentPhase, finalResult?.outcome);

  const visibleLogs = !selectedWorker
    ? logs
    : logs.filter((log) => log.workerId === selectedWorker);

  const tests = finalResult?.test_results || [];
  const passedTests = tests.filter((t) => t.type === "success");
  const failedTests = tests.filter((t) => t.type !== "success");
  const hasTests = tests.length > 0;

  const viewMode: ViewMode = userOverride ?? (hasTests ? "TESTS" : "CONSOLE");

  return {
    phase: currentPhase,
    config,
    finalResult,
    uniqueWorkers,
    visibleLogs,
    passedTests,
    failedTests,
    hasTests,
    viewMode,
    selectedWorker,
    setUserOverride,
    setSelectedWorker,
  };
}

type TerminalToolbarProps = {
  config: { label: string; color: string; text: string };
  viewMode: ViewMode;
  hasTests: boolean;
  passCount: number;
  failCount: number;
  uniqueWorkers: string[];
  selectedWorker: string | null;
  onSetView: (mode: ViewMode) => void;
  onSelectWorker: (workerId: string | null) => void;
};

function TerminalToolbar({
  config,
  viewMode,
  hasTests,
  passCount,
  failCount,
  uniqueWorkers,
  selectedWorker,
  onSetView,
  onSelectWorker,
}: TerminalToolbarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 bg-muted/30 px-3 py-2 border-b border-border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${config.color}`} />
          <span className={`font-semibold text-xs uppercase ${config.text}`}>
            {config.label}
          </span>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* View Toggles */}
        <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-md border border-border/50">
          <Button
            variant={"ghost"}
            size={"sm"}
            onClick={() => onSetView("CONSOLE")}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] transition-all ${
              viewMode === "CONSOLE"
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Terminal className="w-3 h-3" />
            Console
          </Button>
          <Button
            variant={"ghost"}
            size={"sm"}
            onClick={() => onSetView("TESTS")}
            disabled={!hasTests}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] transition-all ${
              viewMode === "TESTS"
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground disabled:opacity-50"
            }`}
          >
            <FileText className="w-3 h-3" />
            Results
            {hasTests && (
              <div className="ml-2 flex items-center gap-2 border-l pl-2 border-border/50">
                {passCount > 0 && (
                  <span className="flex items-center gap-1 text-[var(--chart-2)]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{passCount}</span>
                  </span>
                )}
                {failCount > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="w-3 h-3" />
                    <span>{failCount}</span>
                  </span>
                )}
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Worker Filters */}
      {viewMode === "CONSOLE" && uniqueWorkers.length > 0 && (
        <div className="flex items-center gap-1 animate-in fade-in">
          <Button
            size={"sm"}
            variant={"ghost"}
            onClick={() => onSelectWorker(null)}
            className={`text-[10px] px-2 py-0.5 rounded-sm  ${
              selectedWorker === null
                ? "bg-secondary font-bold text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            ALL
          </Button>
          {uniqueWorkers.map((wid) => (
            <Button
              size={"sm"}
              variant={"ghost"}
              key={wid}
              onClick={() => onSelectWorker(wid)}
              className={`text-[10px] px-2 py-0.5 rounded-sm  ${
                selectedWorker === wid
                  ? "bg-secondary font-bold text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {wid}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

type ConsoleViewProps = {
  logs: Array<{ phase: Phase; message: string; workerId?: string }>;
  error?: string | null;
  phase: Phase;
};

function ConsoleView({ logs, error, phase }: ConsoleViewProps) {
  return (
    <div className="absolute inset-0 overflow-auto p-3 text-xs leading-5 text-muted-foreground scroll-smooth">
      {error && (
        <div className="mb-4 rounded border border-destructive/20 bg-destructive/5 p-3 text-destructive">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertCircle className="w-4 h-4" />
            System Error
          </div>
          <div className="whitespace-pre-wrap">{error}</div>
        </div>
      )}

      {logs.length === 0 && phase !== "PENDING" && (
        <span className="text-muted-foreground/40 italic select-none">
          No output...
        </span>
      )}

      {logs.map((log, idx) => (
        <div
          key={`${log.message}-${idx}`}
          className="whitespace-pre-wrap break-all"
        >
          {log.phase === "COMPILING" ? (
            <span className="text-primary/60 mr-2 select-none font-bold text-[10px]">
              [BLD {log.workerId}]
            </span>
          ) : log.phase === "RUNNING" ? (
            <span className="text-[var(--chart-2)]/80 mr-2 select-none font-bold text-[10px]">
              [RUN {log.workerId}]
            </span>
          ) : log.phase === "DEBUGGING" ? (
            <span className="text-yellow-500/80 mr-2 select-none font-bold text-[10px]">
              [DBG {log.workerId}]
            </span>
          ) : null}
          <span className="text-foreground/90">{log.message}</span>
        </div>
      ))}

      {(phase === "RUNNING" || phase === "COMPILING") && (
        <div className="mt-2 h-2 w-1.5 animate-pulse bg-primary" />
      )}
    </div>
  );
}

type TestResultsViewProps = {
  passedTests: TestResult[];
  failedTests: TestResult[];
};

function TestResultsView({ passedTests, failedTests }: TestResultsViewProps) {
  return (
    <div className="absolute inset-0 overflow-auto p-3 animate-in fade-in slide-in-from-bottom-1">
      {failedTests.length > 0 && (
        <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/5">
          <div className="sticky top-0 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive backdrop-blur-sm flex justify-between items-center z-10 rounded-t-md border-b border-destructive/10">
            <span>Failed Tests ({failedTests.length})</span>
          </div>
          <div className="divide-y divide-destructive/10">
            {failedTests.map((t, i) => (
              <div
                key={`${t.message}-${i}`}
                className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-destructive/10 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />

                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="font-semibold text-destructive shrink-0">
                    {t.name}
                  </span>
                  {(t.message || t.panic) && (
                    <span
                      className="text-muted-foreground truncate opacity-80"
                      title={t.panic || t.message}
                    >
                      {t.panic || t.message}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {passedTests.length > 0 && (
        <div className="rounded-md border border-border">
          <div className="sticky top-0 bg-[var(--chart-2)]/10 px-3 py-1.5 text-xs font-bold text-[var(--chart-2)] backdrop-blur-sm z-10 rounded-t-md border-b border-border/50">
            Passed Tests ({passedTests.length})
          </div>
          <div className="divide-y divide-border/50">
            {passedTests.map((t, i) => (
              <div
                key={`${t.message}-${i}`}
                className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--chart-2)] shrink-0" />
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type TerminalOutputProps = {
  messages: StreamingJobEvent[];
};

export function TerminalOutput({ messages }: TerminalOutputProps) {
  const ctrl = useTerminalController(messages);

  return (
    <div className="flex h-full w-full flex-col rounded-md border border-border overflow-hidden text-sm font-mono shadow-sm bg-background">
      <TerminalToolbar
        config={ctrl.config}
        viewMode={ctrl.viewMode}
        hasTests={ctrl.hasTests}
        passCount={ctrl.passedTests.length}
        failCount={ctrl.failedTests.length}
        uniqueWorkers={ctrl.uniqueWorkers}
        selectedWorker={ctrl.selectedWorker}
        onSetView={ctrl.setUserOverride}
        onSelectWorker={ctrl.setSelectedWorker}
      />
      <div className="relative flex-1 min-h-0 w-full">
        {ctrl.viewMode === "CONSOLE" && (
          <ConsoleView
            logs={ctrl.visibleLogs}
            error={ctrl.finalResult?.error}
            phase={ctrl.phase}
          />
        )}
        {ctrl.viewMode === "TESTS" && (
          <TestResultsView
            passedTests={ctrl.passedTests}
            failedTests={ctrl.failedTests}
          />
        )}
      </div>
    </div>
  );
}
