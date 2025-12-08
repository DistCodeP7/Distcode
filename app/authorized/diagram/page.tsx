"use client";

import Plot from "@/components/custom/diagram/Plot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  Clock,
  Columns,
  Moon,
  RefreshCw,
  Sun,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

// ==========================================
// 1. TYPES & CONFIG
// ==========================================

type VectorClock = Record<string, number>;

export type TJob_Process_Messages = {
  id: number;
  jobUid: string;
  sendTime: number;
  receiveTime: number;
  from: string;
  to: string;
  type: string;
  vector_clock: VectorClock;
  payload: string;
};

const ACTORS = ["Client", "API_Gateway", "Worker_Node", "Database"];

const MESSAGE_TYPES = [
  "JOB_SUBMIT",
  "AUTH_CHECK",
  "QUEUE_PUSH",
  "PROCESS_START",
  "DB_WRITE",
  "CACHE_UPDATE",
  "NOTIFY_SUCCESS",
];

const ACTOR_COLORS: { [key: string]: string } = {
  Client: "#10b981", // Emerald
  API_Gateway: "#3b82f6", // Blue
  Worker_Node: "#f59e0b", // Amber
  Database: "#8b5cf6", // Violet
};

// ==========================================
// 2. LOGIC (GENERATOR)
// ==========================================

function generateTrace(count: number, jobUid: string): TJob_Process_Messages[] {
  let messages: TJob_Process_Messages[] = [];
  let currentTime = Date.now();
  let currentClock: VectorClock = ACTORS.reduce(
    (acc, a) => ({ ...acc, [a]: 0 }),
    {}
  );

  for (let i = 1; i <= count; i++) {
    const from = ACTORS[Math.floor(Math.random() * ACTORS.length)];
    let to = from;
    while (to === from) to = ACTORS[Math.floor(Math.random() * ACTORS.length)];

    currentTime += Math.floor(Math.random() * 400) + 100;
    const latency = Math.floor(Math.random() * 600) + 200;

    const senderClock = { ...currentClock };
    senderClock[from] = (senderClock[from] || 0) + 1;
    currentClock = { ...senderClock };

    messages.push({
      id: i,
      jobUid: jobUid,
      sendTime: currentTime,
      receiveTime: currentTime + latency,
      from: from,
      to: to,
      type: MESSAGE_TYPES[Math.floor(Math.random() * MESSAGE_TYPES.length)],
      vector_clock: { ...senderClock },
      payload: `Payload size: ${Math.floor(Math.random() * 50)}kb`,
    });

    currentClock[to] = Math.max(currentClock[to] || 0, senderClock[to] || 0);
  }
  return messages;
}

// ==========================================
// 3. EXTRACTED TABLE COMPONENT
// ==========================================

type ColumnKey = "type" | "flow" | "clock" | "latency" | "payload";

interface EventLedgerProps {
  messages: TJob_Process_Messages[];
}

function EventTable({ messages }: EventLedgerProps) {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Event Ledger</CardTitle>
          <CardDescription>Chronological log of messages.</CardDescription>
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
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.type}
              onCheckedChange={() => toggleColumn("type")}
            >
              Event Type
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.flow}
              onCheckedChange={() => toggleColumn("flow")}
            >
              Flow
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.clock}
              onCheckedChange={() => toggleColumn("clock")}
            >
              Vector Clock
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.latency}
              onCheckedChange={() => toggleColumn("latency")}
            >
              Latency
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.payload}
              onCheckedChange={() => toggleColumn("payload")}
            >
              Payload
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.type && (
                  <TableHead className="w-[150px]">Event Type</TableHead>
                )}
                {visibleColumns.flow && <TableHead>Flow</TableHead>}
                {visibleColumns.payload && <TableHead>Payload</TableHead>}
                {visibleColumns.clock && (
                  <TableHead className="font-mono text-xs">
                    Vector Clock
                  </TableHead>
                )}
                {visibleColumns.latency && (
                  <TableHead className="text-right">Latency</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((m) => (
                <TableRow key={m.id}>
                  {visibleColumns.type && (
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="font-mono text-xs font-normal"
                      >
                        {m.type}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.flow && (
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                        <span
                          className="font-medium"
                          style={{ color: ACTOR_COLORS[m.from] }}
                        >
                          {m.from}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span
                          className="font-medium"
                          style={{ color: ACTOR_COLORS[m.to] }}
                        >
                          {m.to}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.payload && (
                    <TableCell className="text-xs text-muted-foreground">
                      {m.payload}
                    </TableCell>
                  )}
                  {visibleColumns.clock && (
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">
                      {JSON.stringify(m.vector_clock)
                        .replace(/"/g, "")
                        .replace(/,/g, ", ")}
                    </TableCell>
                  )}
                  {visibleColumns.latency && (
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {m.receiveTime - m.sendTime}ms
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 4. MAIN PAGE COMPONENT
// ==========================================

export default function SpaceTimeDiagram() {
  const [msgCount, setMsgCount] = useState(25);
  const [messages, setMessages] = useState<TJob_Process_Messages[]>([]);
  const [jobUid, setJobUid] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to Dark Mode for the chart

  const generate = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const uid = "TRACE-" + Math.floor(Math.random() * 90000 + 10000);
      setJobUid(uid);
      setMessages(generateTrace(msgCount, uid));
      setIsGenerating(false);
    }, 150);
  }, [msgCount]);

  useEffect(() => {
    generate();
  }, [generate]);

  // --- Plotly Layout Memoization ---
  const { plotData, layout, dynamicHeight } = useMemo(() => {
    if (!messages.length)
      return { plotData: [], layout: {}, dynamicHeight: 500 };

    const minTime = messages[0].sendTime;
    const maxTime = messages[messages.length - 1].receiveTime;
    const dynamicHeight = Math.max(600, messages.length * 50);

    // Define colors based on Theme State
    const themeColors = isDarkMode
      ? {
          bg: "#09090b", // zinc-950
          text: "#e4e4e7", // zinc-200
          grid: "#27272a", // zinc-800
          line: "#3f3f46", // zinc-700
        }
      : {
          bg: "#ffffff",
          text: "#333333",
          grid: "#f3f4f6",
          line: "#e5e7eb",
        };

    // Swimlanes
    const shapes = ACTORS.map((actor) => ({
      type: "line",
      x0: actor,
      x1: actor,
      y0: minTime - 5000,
      y1: maxTime + 5000,
      line: {
        color: themeColors.line,
        width: 1,
        dash: "longdash",
      },
      layer: "below",
    }));

    // Traces
    const traces: any[] = [];
    messages.forEach((msg) => {
      const color = ACTOR_COLORS[msg.from];
      traces.push({
        x: [msg.from, msg.to],
        y: [msg.sendTime, msg.receiveTime],
        mode: "lines+markers",
        type: "scatter",
        line: { color: color, width: 2 },
        marker: {
          color: [color, color],
          size: [8, 12],
          symbol: ["circle", "triangle-up"],
          line: { color: themeColors.bg, width: 1 }, // border around dots for contrast
        },
        hoverinfo: "text",
        text: [
          `<b>SENDER: ${msg.from}</b><br>Sent: ${new Date(
            msg.sendTime
          ).toLocaleTimeString()}<br>Type: ${msg.type}`,
          `<b>RECEIVER: ${msg.to}</b><br>Received: ${new Date(
            msg.receiveTime
          ).toLocaleTimeString()}<br>Latency: ${
            msg.receiveTime - msg.sendTime
          }ms`,
        ],
        showlegend: false,
      });
    });

    const layoutConfig = {
      margin: { l: 40, r: 40, t: 40, b: 40 },
      height: dynamicHeight,
      plot_bgcolor: themeColors.bg,
      paper_bgcolor: themeColors.bg,
      xaxis: {
        type: "category",
        categoryarray: ACTORS,
        categoryorder: "array",
        fixedrange: true,
        side: "top",
        tickfont: {
          size: 14,
          color: themeColors.text,
          family: "var(--font-sans)",
        },
        gridcolor: themeColors.grid,
      },
      yaxis: {
        type: "date",
        tickformat: "%H:%M:%S.%L",
        autorange: "reversed",
        gridcolor: themeColors.grid,
        tickfont: {
          color: themeColors.text,
        },
      },
      shapes: shapes,
      hovermode: "closest",
    };

    return { plotData: traces, layout: layoutConfig, dynamicHeight };
  }, [messages, isDarkMode]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* 1. Header Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Distributed Trace Visualizer
            </CardTitle>
            <CardDescription>
              Visualizing physical latency and Lamport logical clocks for Job{" "}
              <span className="font-mono font-medium text-foreground">
                {jobUid}
              </span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="h-9 w-9"
              title="Toggle Chart Theme"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Count
              </span>
              <Input
                type="number"
                value={msgCount}
                onChange={(e) => setMsgCount(Number(e.target.value))}
                className="w-20 h-9"
                min={5}
                max={200}
              />
            </div>
            <Button onClick={generate} disabled={isGenerating}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
              />
              Regenerate
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 2. Visualization Card */}
      <Card className="overflow-hidden border-2">
        <CardHeader className="border-b bg-muted/40 py-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Space-Time Latency Diagram
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-background">
          <div style={{ width: "100%", height: dynamicHeight }}>
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
          </div>
        </CardContent>
      </Card>

      {/* 3. Event Ledger Table (Extracted Component) */}
      <EventTable messages={messages} />
    </div>
  );
}
