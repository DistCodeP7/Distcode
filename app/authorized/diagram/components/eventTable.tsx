"use client";

import { ArrowRight, Columns } from "lucide-react";
import { useState } from "react";
import {
  getActorColor,
  getLogicalTime,
  type PairedTransmission,
} from "@/app/authorized/diagram/trace";
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

type ColumnKey = "type" | "flow" | "clock" | "latency" | "payload";

export function EventTable({
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

  const toggleColumn = (key: ColumnKey) =>
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));

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
