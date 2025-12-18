"use client";

import { useTheme } from "next-themes";
import { useCallback, useMemo, useState } from "react";
import type { TJob_Process_Messages } from "@/drizzle/schema";
import { getTraceDataAction } from "../actions";
import { getActorColor, getLogicalTime, pairEvents } from "../trace";
import { EventTable } from "./eventTable";
import { type JobInfo, TraceHeaderCard } from "./traceHeaderCard";
import { TracePlotCard } from "./tracePlotCard";

export default function DiagramClient({
  initialJobs,
  initialJob,
  initialEvents,
}: {
  userId: string;
  initialJobs: JobInfo[];
  initialJob: JobInfo;
  initialEvents: TJob_Process_Messages[];
}) {
  const [userJobInfo] = useState<JobInfo[]>(initialJobs);
  const [jobInfo, setJobInfo] = useState<JobInfo>(initialJob);
  const [rawEvents, setRawEvents] =
    useState<TJob_Process_Messages[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);

  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const fetchData = useCallback(async () => {
    if (!jobInfo?.jobUid) return;
    setIsLoading(true);

    const result = await getTraceDataAction(jobInfo.jobUid);
    if (result.success && result.data) {
      setRawEvents(result.data as TJob_Process_Messages[]);
    } else {
      setRawEvents([]);
    }

    setIsLoading(false);
  }, [jobInfo]);

  const pairedTransmissions = useMemo(() => pairEvents(rawEvents), [rawEvents]);

  const actors = useMemo(() => {
    const s = new Set<string>();
    rawEvents.forEach((e) => {
      s.add(e.from);
      s.add(e.to);
    });
    return Array.from(s).sort();
  }, [rawEvents]);

  const { plotData, layout, dynamicHeight } = useMemo(() => {
    if (!pairedTransmissions.length)
      return { plotData: [], layout: {}, dynamicHeight: 600 };

    const logicalTimes = rawEvents.map((e) => getLogicalTime(e.vector_clock));
    const minLogical = Math.min(...logicalTimes);
    const maxLogical = Math.max(...logicalTimes);

    const colors = isDarkMode
      ? { bg: "#09090b", text: "#e4e4e7", grid: "#27272a", line: "#3f3f46" }
      : { bg: "#ffffff", text: "#333333", grid: "#f3f4f6", line: "#e5e7eb" };

    const shapes = actors.map((actor) => ({
      type: "line",
      x0: actor,
      x1: actor,
      y0: minLogical - 1,
      y1: maxLogical + 1,
      line: { color: colors.line, width: 1, dash: "longdash" },
      layer: "below",
    }));

    const traces = pairedTransmissions.map((tx) => {
      const color = getActorColor(tx.from);
      const sendY = getLogicalTime(tx.sendEvent.vector_clock);
      const recvY = getLogicalTime(tx.recvEvent?.vector_clock);

      return {
        x: [tx.from, tx.to],
        y: [sendY, recvY],
        mode: "lines+markers",
        type: "scatter",
        line: { color, width: 2 },
        marker: {
          color: [color, color],
          size: [8, 12],
          symbol: ["circle", "triangle-up"],
          line: { color: colors.bg, width: 1 },
        },
        hoverinfo: "text",
        text: [
          `<b>SEND (${tx.type})</b><br>Tick: ${sendY}<br>Time: ${new Date(
            tx.sendEvent.timestamp
          ).toLocaleTimeString()}<br>Payload: ${JSON.stringify(tx.payload)}`,
          `<b>RECV</b><br>Tick: ${recvY}<br>Latency: ${tx.latency}ms`,
        ],
        showlegend: false,
      };
    });

    const layoutConfig = {
      margin: { l: 60, r: 50, t: 50, b: 50 },
      height: 600,
      plot_bgcolor: colors.bg,
      paper_bgcolor: colors.bg,
      xaxis: {
        type: "category",
        categoryarray: actors,
        categoryorder: "array",
        fixedrange: true,
        side: "top",
        tickfont: { size: 14, color: colors.text },
        gridcolor: colors.grid,
      },
      yaxis: {
        type: "linear",
        title: "Logical Time (Σ Vector Clock)",
        autorange: "reversed",
        gridcolor: colors.grid,
        tickfont: { color: colors.text },
        dtick: 1,
      },
      shapes,
      hovermode: "closest",
    };

    return { plotData: traces, layout: layoutConfig, dynamicHeight: 600 };
  }, [pairedTransmissions, isDarkMode, rawEvents, actors]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <TraceHeaderCard
        jobInfo={jobInfo}
        userJobInfo={userJobInfo}
        isLoading={isLoading}
        onSelectJob={(j) => setJobInfo(j)}
        onFetch={fetchData}
      />

      <TracePlotCard
        plotData={plotData}
        layout={layout}
        height={dynamicHeight}
        isLoading={isLoading}
      />

      <EventTable transmissions={pairedTransmissions} />
    </div>
  );
}
