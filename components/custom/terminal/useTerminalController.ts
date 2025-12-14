import { useState } from "react";
import type {
  Outcome,
  Phase,
  ResultEventPayload,
  StreamingJobEvent,
  TestResult,
} from "@/types/streamingEvents";

export type ViewMode = "CONSOLE" | "TESTS";

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
        color: "bg-amber-500",
        text: "text-amber-500",
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
  let jobUid = "";

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
      jobUid = msg.job_uid;
    }
  }

  // --- 2. Derived Data ---
  const uniqueWorkers = Array.from(workerIds).sort();
  const config = getStatusConfig(currentPhase, finalResult?.outcome);

  const visibleLogs = !selectedWorker
    ? logs
    : logs.filter((log) => log.workerId === selectedWorker);

  const tests: TestResult[] = finalResult?.test_results || [];
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
    jobUid,
  };
}
