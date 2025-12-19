"use client";

import { Activity, ChevronDown, ChevronUp, Columns, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";
import { cn } from "@/lib/utils";
import { useState } from "react";

export type JobInfo = {
  jobUid: string;
  exerciseId: number;
  exerciseTitle: string;
};

export function TraceHeaderCard({
  jobInfo,
  userJobInfo,
  isLoading,
  onSelectJob,
  onFetch,
}: {
  jobInfo: JobInfo;
  userJobInfo: JobInfo[];
  isLoading: boolean;
  onSelectJob: (jid: JobInfo) => void;
  onFetch: () => void;
}) {
  const [openDropdown, setOpenDropdown] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Trace Visualizer (Logical Time)
          </CardTitle>
          <CardDescription>
            Exercise:{" "}
            <span className="font-mono text-foreground">
              {jobInfo.exerciseTitle}
            </span>
          </CardDescription>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Select Exercise
                {openDropdown ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[200px]">
              <div className="p-2 space-y-1">
                <p className="text-sm font-medium">Select Exercise</p>
                <div className="flex flex-col gap-1 max-h-60 overflow-auto">
                  {userJobInfo.map((jid) => (
                    <DropdownMenuItem
                      key={jid.jobUid}
                      className={cn(
                        "justify-start font-mono text-xs",
                        jid.jobUid === jobInfo.jobUid ? "bg-muted" : ""
                      )}
                      onSelect={() => onSelectJob(jid)}
                    >
                      {jid.exerciseTitle}
                    </DropdownMenuItem>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={onFetch} disabled={isLoading} size="sm">
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Fetch
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
