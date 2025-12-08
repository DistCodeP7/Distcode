"use client";

import Plot from "@/components/custom/diagram/Plot";
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
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  ArrowRight,
  Columns,
  Moon,
  RefreshCw,
  Search,
  Sun,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getTraceDataAction } from "./actions";

// ==========================================
// 1. TYPES
// ==========================================

export type VClock = Record<string, number>;

// The transformed row from the Server Action
export type TJob_Process_Messages = {
  id: number;
  jobUid: string;
  eventId: string;
  messageId: string;
  timestamp: number; // Milliseconds now!
  from: string;
  to: string;
  eventType: "SEND" | "RECV" | "DROP" | string; // Type loosening for DB variants
  messageType: string;
  vector_clock: VClock;
  payload: any;
};

type PairedTransmission = {
  messageId: string;
  from: string;
  to: string;
  type: string;
  sendEvent: TJob_Process_Messages;
  recvEvent?: TJob_Process_Messages;
  latency?: number;
  payload: any;
};

// ==========================================
// 2. LOGIC (TRANSFORMER)
// ==========================================

function pairEvents(events: TJob_Process_Messages[]): PairedTransmission[] {
  const map = new Map<string, Partial<PairedTransmission>>();

  events.forEach((e) => {
    if (!map.has(e.messageId)) {
      map.set(e.messageId, {
        messageId: e.messageId,
        from: e.from, // Note: For RECV events, 'from' is still the sender
        to: e.to, // Note: For RECV events, 'to' is the receiver
        type: e.messageType,
        payload: e.payload,
      });
    }
    const entry = map.get(e.messageId)!;

    // Use loose string matching to handle case sensitivity if DB is inconsistent
    const evtType = e.eventType.toUpperCase();

    if (evtType === "SEND") {
      entry.sendEvent = e;
    } else if (evtType === "RECV") {
      entry.recvEvent = e;
    }
  });

  return Array.from(map.values())
    .filter((x) => x.sendEvent && x.recvEvent)
    .map((x) => ({
      ...x,
      // Calculate Latency in Milliseconds
      latency: parseFloat(
        (x.recvEvent!.timestamp - x.sendEvent!.timestamp).toFixed(3)
      ),
    })) as PairedTransmission[];
}

// ==========================================
// 3. TABLE COMPONENT
// ==========================================

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

  // Generate dynamic colors for actors
  const getActorColor = (actor: string) => {
    let hash = 0;
    for (let i = 0; i < actor.length; i++)
      hash = actor.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
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
                  <TableHead className="text-right">Latency</TableHead>
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
                      {JSON.stringify(t.payload)}
                    </TableCell>
                  )}
                  {visibleColumns.clock && (
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      <div className="flex flex-col">
                        <span>
                          S: {JSON.stringify(t.sendEvent.vector_clock)}
                        </span>
                        <span>
                          R: {JSON.stringify(t.recvEvent?.vector_clock)}
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

// ==========================================
// 4. MAIN PAGE
// ==========================================

export default function SpaceTimeDiagram({
  initialJobId,
}: {
  initialJobId?: string;
}) {
  const [jobUid, setJobUid] = useState<string>(
    initialJobId || "ab873177-6580-4fca-a65b-260422823078"
  );
  const [rawEvents, setRawEvents] = useState<TJob_Process_Messages[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

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

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Transform Data
  const pairedTransmissions = useMemo(() => pairEvents(rawEvents), [rawEvents]);

  // Extract Unique Actors (Swimlanes) dynamically from data
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

    const minTime = Math.min(...rawEvents.map((e) => e.timestamp));
    const maxTime = Math.max(...rawEvents.map((e) => e.timestamp));
    const dynamicHeight = 500;

    const theme = isDarkMode
      ? { bg: "#09090b", text: "#e4e4e7", grid: "#27272a", line: "#3f3f46" }
      : { bg: "#ffffff", text: "#333333", grid: "#f3f4f6", line: "#e5e7eb" };

    // Helper for consistent colors
    const getActorColor = (actor: string) => {
      let hash = 0;
      for (let i = 0; i < actor.length; i++)
        hash = actor.charCodeAt(i) + ((hash << 5) - hash);
      const c = (hash & 0x00ffffff).toString(16).toUpperCase();
      return "#" + "00000".substring(0, 6 - c.length) + c;
    };

    const shapes = actors.map((actor) => ({
      type: "line",
      x0: actor,
      x1: actor,
      y0: minTime - 5, // Small buffer
      y1: maxTime + 5,
      line: { color: theme.line, width: 1, dash: "longdash" },
      layer: "below",
    }));

    const traces: any[] = [];
    pairedTransmissions.forEach((tx) => {
      if (!tx.sendEvent || !tx.recvEvent) return;
      const color = getActorColor(tx.from);

      traces.push({
        x: [tx.from, tx.to],
        y: [tx.sendEvent.timestamp, tx.recvEvent.timestamp],
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
          `<b>TYPE: ${tx.type}</b><br>MsgID: ${tx.messageId.slice(0, 8)}...<br>Time: ${new Date(tx.sendEvent.timestamp).toLocaleTimeString()}<br>Payload: ${JSON.stringify(tx.payload)}`,
          `<b>LATENCY: ${tx.latency}ms</b><br>Recv: ${new Date(tx.recvEvent.timestamp).toLocaleTimeString()}`,
        ],
        showlegend: false,
      });
    });

    const layoutConfig = {
      margin: { l: 50, r: 50, t: 50, b: 50 },
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
        type: "date",
        tickformat: "%H:%M:%S.%L", // Shows milliseconds
        autorange: "reversed",
        gridcolor: theme.grid,
        tickfont: { color: theme.text },
      },
      shapes: shapes,
      hovermode: "closest",
    };

    return { plotData: traces, layout: layoutConfig, dynamicHeight };
  }, [pairedTransmissions, isDarkMode, rawEvents, actors]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Trace Visualizer
            </CardTitle>
            <CardDescription>
              Job UID:{" "}
              <span className="font-mono text-foreground">{jobUid}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <Input
                value={jobUid}
                onChange={(e) => setJobUid(e.target.value)}
                className="w-[300px]"
                placeholder="Enter Job UID..."
              />
              <Button onClick={fetchData} disabled={isLoading}>
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
