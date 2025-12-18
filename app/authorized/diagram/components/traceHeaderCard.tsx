"use client";

import { Activity, Columns, RefreshCw, Search } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Select Exercise
                <Columns className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[200px]">
              <div className="p-2 space-y-1">
                <p className="text-sm font-medium">Select Exercise</p>
                <div className="flex flex-col gap-1 max-h-60 overflow-auto">
                  {userJobInfo.map((jid) => (
                    <Button
                      key={jid.jobUid}
                      variant={
                        jid.jobUid === jobInfo.jobUid ? "secondary" : "ghost"
                      }
                      size="sm"
                      className="justify-start font-mono text-xs"
                      onClick={() => onSelectJob(jid)}
                    >
                      {jid.exerciseTitle}
                    </Button>
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
