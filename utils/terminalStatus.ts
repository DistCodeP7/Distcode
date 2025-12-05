import type { CompiledEvent } from "@/types/streamingEvents";

export type OverallStatus =
  | "idle"
  | "running"
  | "all_passed"
  | "all_failed"
  | "some_passed";

type ComputeStatusArgs = {
  allEventsLength: number;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  compiledEvent?: CompiledEvent;
  hasFailLogLine: boolean;
};

export function computeStatusAndLabel({
  allEventsLength,
  totalTests,
  passedCount,
  failedCount,
  compiledEvent,
  hasFailLogLine,
}: ComputeStatusArgs): { status: OverallStatus; statusLabel: string } {
  let status: OverallStatus;

  if (allEventsLength === 0) {
    status = "idle";
  } else if (totalTests > 0) {
    if (failedCount === 0 && passedCount > 0) {
      status = "all_passed";
    } else if (passedCount === 0 && failedCount > 0) {
      status = "all_failed";
    } else if (passedCount > 0 && failedCount > 0) {
      status = "some_passed";
    } else {
      status = "running";
    }
  } else if (compiledEvent && !compiledEvent.success) {
    status = "all_failed";
  } else if (hasFailLogLine) {
    status = "all_failed";
  } else {
    status = "running";
  }

  const percentage =
    totalTests > 0 ? Math.round((passedCount / totalTests) * 100) : 0;

  let statusLabel: string;

  if (totalTests > 0) {
    const summary = `${passedCount}/${totalTests} tests passed (${percentage}%)`;
    if (status === "all_passed") {
      statusLabel = `All tests passed · ${summary}`;
    } else if (status === "all_failed") {
      statusLabel = `All tests failed · ${summary}`;
    } else if (status === "some_passed") {
      statusLabel = `Some tests failed · ${summary}`;
    } else if (status === "running") {
      statusLabel = `Running tests... · ${summary}`;
    } else {
      statusLabel = `Idle · ${summary}`;
    }
  } else {
    statusLabel =
      status === "all_failed"
        ? "Tests failed"
        : status === "running"
          ? "Running tests..."
          : status === "idle"
            ? "Idle"
            : "Tests finished";
  }

  return { status, statusLabel };
}
