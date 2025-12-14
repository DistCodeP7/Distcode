"use client";

import {
  Activity,
  ArrowRight,
  Columns,
  Moon,
  RefreshCw,
  Search,
  Sun,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getExerciseJobUid,
  getTraceDataAction,
} from "@/app/authorized/diagram/actions";
import Plot from "@/components/custom/diagram/plot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// 1. TYPES
export type VClock = Record<string, number>;

export type TJob_Process_Messages = {
  id: number;
  jobUid: string;
  eventId: string;
  messageId: string;
  timestamp: number; // Milliseconds
  from: string;
  to: string;
  eventType: "SEND" | "RECV" | "DROP" | string;
  messageType: string;
  vector_clock: VClock;
  payload: unknown;
};

type PairedTransmission = {
  messageId: string;
  from: string;
  to: string;
  type: string;
  sendEvent: TJob_Process_Messages;
  recvEvent?: TJob_Process_Messages;
  latency?: number;
  payload: unknown;
};

// 2. LOGIC (TRANSFORMER)
// Helper to convert Vector Clock to Scalar Logical Time (Sum of components)
// This ensures that if A -> B, then Scalar(A) < Scalar(B)
function getLogicalTime(clock: VClock | undefined): number {
  if (!clock) return 0;
  return Object.values(clock).reduce((acc, val) => acc + val, 0);
}

function pairEvents(events: TJob_Process_Messages[]): PairedTransmission[] {
  const map = new Map<string, Partial<PairedTransmission>>();

  events.forEach((e) => {
    if (!map.has(e.messageId)) {
      map.set(e.messageId, {
        messageId: e.messageId,
        from: e.from,
        to: e.to,
        type: e.messageType,
        payload: e.payload,
      });
    }
    const entry = map.get(e.messageId);
    if (!entry) return;
    const evtType = e.eventType.toUpperCase();

    if (evtType === "SEND") {
      entry.sendEvent = e;
    } else if (evtType === "RECV") {
      entry.recvEvent = e;
    }
  });

  // Type guard to narrow entries that have both sendEvent and recvEvent
  function hasSendAndRecv(
    x: Partial<PairedTransmission>
  ): x is PairedTransmission & {
    sendEvent: TJob_Process_Messages;
    recvEvent: TJob_Process_Messages;
  } {
    return !!x.sendEvent && !!x.recvEvent;
  }

  return Array.from(map.values())
    .filter(hasSendAndRecv)
    .map((x) => ({
      ...x,
      // Calculate Latency in MS for the Table/Tooltip, even if plot is logical
      latency: parseFloat(
        (x.recvEvent.timestamp - x.sendEvent.timestamp).toFixed(3)
      ),
    }));
}

// 3. TABLE COMPONENT
type ColumnKey = "type" | "flow" | "clock" | "latency" | "payload";

function EventTable({
  transmissions,
}: {
  transmissions: PairedTransmission[];
}) {
  const [visibleColumns, setVisibleColumns] = useState<
    Record<ColumnKey, boolean>
  >({
    type: true,
    flow: true,
    clock: true,
    latency: true,
    payload: false,
  });

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getActorColor = (actor: string) => {
    let hash = 0;
    for (let i = 0; i < actor.length; i++)
      hash = actor.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return `#${"00000".substring(0, 6 - c.length)}${c}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Event Ledger</CardTitle>
          <CardDescription>
            {transmissions.length} paired transmissions found.
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto h-8 flex gap-2"
            >
              <Columns className="h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[150px]">
            {Object.keys(visibleColumns).map((key) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={visibleColumns[key as ColumnKey]}
                onCheckedChange={() => toggleColumn(key as ColumnKey)}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border max-h-[500px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary z-10">
              <TableRow>
                {visibleColumns.type && <TableHead>Type</TableHead>}
                {visibleColumns.flow && <TableHead>Flow</TableHead>}
                {visibleColumns.payload && <TableHead>Payload</TableHead>}
                {visibleColumns.clock && <TableHead>Vector Clock</TableHead>}
                {visibleColumns.latency && (
                  <TableHead className="text-right">Latency (ms)</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transmissions.map((t) => (
                <TableRow key={t.messageId}>
                  {visibleColumns.type && (
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px]"
                      >
                        {t.type}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.flow && (
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                        <span
                          className="font-bold"
                          style={{ color: getActorColor(t.from) }}
                        >
                          {t.from}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span
                          className="font-bold"
                          style={{ color: getActorColor(t.to) }}
                        >
                          {t.to}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.payload && (
                    <TableCell className="text-xs max-w-[200px] truncate text-muted-foreground">
                      <pre>{JSON.stringify(t.payload, null, 2)}</pre>
                    </TableCell>
                  )}
                  {visibleColumns.clock && (
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">
                            S:
                          </span>
                          {JSON.stringify(t.sendEvent.vector_clock)}
                          <span className="opacity-50 text-[9px]">
                            (Σ{getLogicalTime(t.sendEvent.vector_clock)})
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">
                            R:
                          </span>
                          {JSON.stringify(t.recvEvent?.vector_clock)}
                          <span className="opacity-50 text-[9px]">
                            (Σ{getLogicalTime(t.recvEvent?.vector_clock)})
                          </span>
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.latency && (
                    <TableCell className="text-right font-mono text-xs">
                      {t.latency}ms
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  );
}

// 4. MAIN PAGE
export default function SpaceTimeDiagram() {
  const session = useSession();
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("jobuid") || "";
  const [jobUid, setJobUid] = useState<string>(initialJobId);
  const [rawEvents, setRawEvents] = useState<TJob_Process_Messages[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [userJobUids, setUserJobUids] = useState<string[]>(["loading..."]);

  const fetchJobUids = useCallback(async () => {
    const result = await getExerciseJobUid(session.data?.user?.id || "");
    if (result.length === 0) {
      setUserJobUids(["no jobs found"]);
    } else {
      setUserJobUids(result);
    }
  }, [session.data?.user?.id]);

  // FETCH DATA
  const fetchData = useCallback(async () => {
    if (!jobUid) return;
    setIsLoading(true);
    const result = await getTraceDataAction(jobUid);
    if (result.success && result.data) {
      setRawEvents(result.data as TJob_Process_Messages[]);
    } else {
      console.error(result.error);
      setRawEvents([]);
    }
    setIsLoading(false);
  }, [jobUid]);

  useEffect(() => {
    fetchData();
    fetchJobUids();
  }, [fetchData, fetchJobUids]);

  const pairedTransmissions = useMemo(() => pairEvents(rawEvents), [rawEvents]);

  const actors = useMemo(() => {
    const s = new Set<string>();
    rawEvents.forEach((e) => {
      s.add(e.from);
      s.add(e.to);
    });
    return Array.from(s).sort();
  }, [rawEvents]);

  // Prepare Plot
  const { plotData, layout, dynamicHeight } = useMemo(() => {
    if (!pairedTransmissions.length)
      return { plotData: [], layout: {}, dynamicHeight: 500 };

    // Calculate Logical Min/Max for plotting range
    const logicalTimes = rawEvents.map((e) => getLogicalTime(e.vector_clock));
    const minLogical = Math.min(...logicalTimes);
    const maxLogical = Math.max(...logicalTimes);

    // Height calculation based on logical depth could be useful, but fixed is fine for now
    const dynamicHeight = 600;

    const theme = isDarkMode
      ? { bg: "#09090b", text: "#e4e4e7", grid: "#27272a", line: "#3f3f46" }
      : { bg: "#ffffff", text: "#333333", grid: "#f3f4f6", line: "#e5e7eb" };

    const getActorColor = (actor: string) => {
      let hash = 0;
      for (let i = 0; i < actor.length; i++)
        hash = actor.charCodeAt(i) + ((hash << 5) - hash);
      const c = (hash & 0x00ffffff).toString(16).toUpperCase();
      return `#${"00000".substring(0, 6 - c.length)}${c}`;
    };

    // Swimlanes (vertical lines)
    const shapes = actors.map((actor) => ({
      type: "line",
      x0: actor,
      x1: actor,
      y0: minLogical - 1,
      y1: maxLogical + 1,
      line: { color: theme.line, width: 1, dash: "longdash" },
      layer: "below",
    }));

    const traces = pairedTransmissions.map((tx) => {
      const color = getActorColor(tx.from);

      // Calculate Y positions using Logical Time
      const sendY = getLogicalTime(tx.sendEvent.vector_clock);
      const recvY = getLogicalTime(tx.recvEvent?.vector_clock);

      return {
        x: [tx.from, tx.to],
        y: [sendY, recvY], // Using Scalar Logical Time
        mode: "lines+markers",
        type: "scatter",
        line: { color: color, width: 2 },
        marker: {
          color: [color, color],
          size: [8, 12],
          symbol: ["circle", "triangle-up"],
          line: { color: theme.bg, width: 1 },
        },
        hoverinfo: "text",
        text: [
          // We display both Logical Tick and Physical Time in tooltip
          `<b>SEND (${tx.type})</b><br>Tick: ${sendY}<br>Time: ${new Date(tx.sendEvent.timestamp).toLocaleTimeString()}<br>Payload: ${JSON.stringify(tx.payload)}`,
          `<b>RECV</b><br>Tick: ${recvY}<br>Latency: ${tx.latency}ms`,
        ],
        showlegend: false,
      };
    });

    const layoutConfig = {
      margin: { l: 60, r: 50, t: 50, b: 50 },
      height: dynamicHeight,
      plot_bgcolor: theme.bg,
      paper_bgcolor: theme.bg,
      xaxis: {
        type: "category",
        categoryarray: actors,
        categoryorder: "array",
        fixedrange: true,
        side: "top",
        tickfont: { size: 14, color: theme.text },
        gridcolor: theme.grid,
      },
      yaxis: {
        type: "linear",
        title: "Logical Time (Σ Vector Clock)",
        autorange: "reversed", // Time flows down
        gridcolor: theme.grid,
        tickfont: { color: theme.text },
        dtick: 1, // Ensure we see integer steps if range allows
      },
      shapes: shapes,
      hovermode: "closest",
    };

    return { plotData: traces, layout: layoutConfig, dynamicHeight };
  }, [pairedTransmissions, isDarkMode, rawEvents, actors]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 ">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Trace Visualizer (Logical Time)
            </CardTitle>
            <CardDescription>
              Job UID:{" "}
              <span className="font-mono text-foreground">{jobUid}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Select Job
                    <Columns className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <div className="p-2 space-y-1">
                    <p className="text-sm font-medium">Select Job UID</p>
                    <div className="flex flex-col gap-1 max-h-60 overflow-auto">
                      {userJobUids.map((jid) => (
                        <Button
                          key={jid}
                          variant={jid === jobUid ? "secondary" : "ghost"}
                          size="sm"
                          className="justify-start font-mono text-xs"
                          onClick={() => setJobUid(jid)}
                        >
                          {jid}
                        </Button>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={fetchData} disabled={isLoading} size="sm">
                {isLoading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Fetch
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="overflow-hidden border-2">
        <CardContent className="p-0 bg-background">
          <div style={{ width: "100%", height: dynamicHeight }}>
            {plotData.length > 0 ? (
              <Plot
                data={plotData}
                // biome-ignore lint/suspicious/noExplicitAny: <Plotty dont exist>
                layout={layout as any}
                config={{
                  responsive: true,
                  displayModeBar: true,
                  displaylogo: false,
                }}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {isLoading
                  ? "Loading trace data..."
                  : "No data found for this Job UID."}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EventTable transmissions={pairedTransmissions} />
    </div>
  );
}
