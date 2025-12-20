import type { JobStatus } from "@/app/exercises/[id]/components/exerciseEditor";
import type { Outcome, Phase } from "@/types/streamingEvents";
import { AlertCircle, AlertTriangle } from "lucide-react";

type ConsoleViewProps = {
  logs: Array<{ phase: Phase; message: string; workerId?: string }>;
  error?: string | null;
  phase: Phase;
  outcome?: Outcome;
  jobStatus?: JobStatus;
};

const Spinner = () => (
  <span className="inline-flex items-center">
    <span className="h-10 w-10 rounded-full border border-muted-foreground/40 border-t-transparent animate-spin" />
  </span>
);

export function ConsoleView({
  logs,
  error,
  phase,
  outcome,
  jobStatus,
}: ConsoleViewProps) {
  const isCancelled = outcome === "CANCELED";
  const isTimeout = outcome === "TIMEOUT";

  return (
    <div className="absolute inset-0 overflow-auto p-3 text-xs leading-5 text-muted-foreground scroll-smooth">
      {error && (
        <div
          className={
            isCancelled
              ? "mb-4 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-amber-500"
              : isTimeout
                ? "mb-4 rounded border border-orange-500/30 bg-orange-500/10 p-3 text-orange-500"
                : "mb-4 rounded border border-destructive/20 bg-destructive/5 p-3 text-destructive"
          }
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            {isCancelled ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Job cancelled</span>
              </>
            ) : isTimeout ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Job timed out</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>System error</span>
              </>
            )}
          </div>
          <div className="whitespace-pre-wrap">{error}</div>
        </div>
      )}

      {jobStatus && phase === "PENDING" && (
        <div className="flex flex-col items-center justify-center py-10 gap-4 text-muted-foreground">
          <Spinner />

          <div className="text-sm">Waiting for an available worker</div>

          <div className="flex gap-6 text-xs">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
                Queue position
              </span>
              <span className="text-base font-medium text-foreground">
                {jobStatus.queueSize}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
                Active workers
              </span>
              <span className="text-base font-medium text-foreground">
                {jobStatus.activeWorkers}
              </span>
            </div>
          </div>

          {jobStatus.queueSize > jobStatus.activeWorkers && (
            <div className="text-xs italic text-muted-foreground/60">
              Jobs are processed as workers become available
            </div>
          )}
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
