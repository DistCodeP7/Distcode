import { useTerminalController } from "@/components/custom/terminal//useTerminalController";
import { ConsoleView } from "@/components/custom/terminal/consoleView";
import { TerminalToolbar } from "@/components/custom/terminal/terminalToolbar";
import { TestResultsView } from "@/components/custom/terminal/testResultsView";
import type { StreamingJobEvent } from "@/types/streamingEvents";

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
            outcome={ctrl.finalResult?.outcome}
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
