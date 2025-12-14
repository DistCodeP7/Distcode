import {
  ArrowLeftRight,
  CheckCircle2,
  FileText,
  Terminal,
  XCircle,
} from "lucide-react";
import { redirect } from "next/navigation";
import { useState } from "react";
import type { ViewMode } from "@/components/custom/terminal/useTerminalController";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "../confirmDialog";

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
  jobUid: string;
};

export function TerminalToolbar({
  config,
  viewMode,
  hasTests,
  passCount,
  failCount,
  uniqueWorkers,
  selectedWorker,
  onSetView,
  onSelectWorker,
  jobUid,
}: TerminalToolbarProps) {
  const [openDialog, setOpenDialog] = useState(false);
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
            variant="ghost"
            size="sm"
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
            variant="ghost"
            size="sm"
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
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasTests}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] transition-all ${
              hasTests
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground disabled:opacity-50"
            }`}
            onClick={() => setOpenDialog(true)}
          >
            <ArrowLeftRight className="w-3 h-3 mr-1" />
            MessageViewer
            <ConfirmDialog
              open={openDialog}
              onOpenChange={(open: boolean): void => setOpenDialog(open)}
              title="Leave Page?"
              description="Ypu are about to leave this page and go to the Message Viewer. Are you sure you want to proceed?"
              onConfirm={() =>
                redirect(`/authorized/diagram/?jobuid=${jobUid}`)
              }
            />
          </Button>
        </div>
      </div>

      {/* Worker Filters */}
      {viewMode === "CONSOLE" && uniqueWorkers.length > 0 && (
        <div className="flex items-center gap-1 animate-in fade-in">
          <Button
            size="sm"
            variant="ghost"
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
              size="sm"
              variant="ghost"
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
