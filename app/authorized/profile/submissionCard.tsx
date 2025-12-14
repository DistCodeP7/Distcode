"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Terminal,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { reconstructStreamEvents } from "@/app/authorized/profile/logReconstructor";
import { TerminalOutput } from "@/components/custom/terminal/terminalOutput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TProblem, TResults } from "@/drizzle/schema";
import { cn } from "@/lib/utils";

const getStatusConfig = (outcome: string | null | undefined) => {
  switch (outcome) {
    case "SUCCESS":
      return {
        label: "Passed",
        color: "bg-green-500",
        text: "text-green-600 dark:text-green-400",
        bgSoft: "bg-green-500/10",
        border: "border-green-500/20",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    case "FAILED":
    case "COMPILATION_ERROR":
      return {
        label: outcome === "COMPILATION_ERROR" ? "Build Error" : "Failed",
        color: "bg-red-500",
        text: "text-red-600 dark:text-red-400",
        bgSoft: "bg-red-500/10",
        border: "border-red-500/20",
        icon: <XCircle className="w-3.5 h-3.5" />,
      };
    default:
      return {
        label: "Pending",
        color: "bg-yellow-500",
        text: "text-yellow-600 dark:text-yellow-400",
        bgSoft: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        icon: <AlertCircle className="w-3.5 h-3.5" />,
      };
  }
};

const formatDate = (date: Date | null) => {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(date));
};

interface SubmissionCardProps {
  problem: TProblem;
  results: TResults | null;
}

export function SubmissionCard({ problem, results }: SubmissionCardProps) {
  const [showLogs, setShowLogs] = useState(false);

  const status = getStatusConfig(results?.outcome);
  const events = results ? reconstructStreamEvents(results) : [];

  return (
    <Card className="group overflow-hidden gap-0 border transition-all duration-300 hover:shadow-md bg-background/50 backdrop-blur-sm">
      {/* --- Header Section --- */}
      <CardHeader className="p-0 mb-0 mt-0 ">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-border/50 bg-muted/10">
          {/* Left: Title & Difficulty */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base leading-none tracking-tight">
                {problem.title}
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 font-normal uppercase tracking-wider opacity-70"
              >
                {problem.difficulty}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
              {problem.description}
            </p>
          </div>

          {/* Right: Status Pill & Meta */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors",
                status.bgSoft,
                status.text,
                status.border
              )}
            >
              {status.icon}
              <span className="uppercase tracking-wide text-[10px]">
                {status.label}
              </span>
            </div>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
              <Clock className="w-3.5 h-3.5 opacity-70" />
              <span>{results?.duration ? `${results.duration}ms` : "--"}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 opacity-70" />
              <span>
                {formatDate(results?.finishedAt || problem.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 m-0">
        <div className="flex flex-col">
          {/* --- Action Bar (Toggle) --- */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-t border-border/40">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Cpu className="w-3.5 h-3.5" />
              <span className="font-mono">
                Execution ID:{" "}
                {results?.id != null
                  ? String(results.id).slice(0, 8)
                  : "local-run"}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogs(!showLogs)}
              className={cn(
                "h-7 text-xs gap-1.5 transition-all",
                showLogs
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Terminal className="w-3.5 h-3.5" />
              {showLogs ? "Hide Output" : "View Logs & Results"}
              {showLogs ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
          </div>
          {showLogs && (
            <div className="animate-in slide-in-from-top-1 fade-in duration-200 border-t border-border">
              <div className="h-[450px] w-full bg-background">
                <TerminalOutput messages={events} exerciseId={0} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
