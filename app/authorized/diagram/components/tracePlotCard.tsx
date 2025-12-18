"use client";

import Plot from "@/components/custom/diagram/plot";
import { Card, CardContent } from "@/components/ui/card";

export function TracePlotCard({
  plotData,
  layout,
  height,
  isLoading,
}: {
  plotData: any[]; // Plotly trace shape
  layout: any; // Plotly layout shape
  height: number;
  isLoading: boolean;
}) {
  return (
    <Card className="overflow-hidden border-2">
      <CardContent className="p-0 bg-background">
        <div style={{ width: "100%", height }}>
          {plotData.length > 0 ? (
            <Plot
              data={plotData}
              // biome-ignore lint/suspicious/noExplicitAny: Plotly types not in repo
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
  );
}
