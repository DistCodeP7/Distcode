import { CheckCircle2, XCircle } from "lucide-react";
import type { TestResult } from "@/types/streamingEvents";

type TestResultsViewProps = {
  passedTests: TestResult[];
  failedTests: TestResult[];
};

export function TestResultsView({
  passedTests,
  failedTests,
}: TestResultsViewProps) {
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
