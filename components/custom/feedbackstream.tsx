// components/FeedbackStream.tsx
"use client";

import { useSSE } from "@/hooks/useSSE";
import { Button } from "@/components/ui/button";

export const FeedbackStream = () => {
  const { isConnected, messages, error, connect, disconnect } =
    useSSE("/api/stream");

  return (
    <section className="flex flex-col items-center gap-4 max-w-3xl mt-12 w-full">
      <h2 className="text-2xl font-semibold">Live Feedback Stream</h2>

      <div className="flex gap-2">
        {!isConnected ? (
          <Button onClick={connect}>Start Stream</Button>
        ) : (
          <Button variant="destructive" onClick={disconnect}>
            Stop Stream
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Status: {isConnected ? "Connected" : "Disconnected"}
      </p>
      {error && <p className="text-red-500">{error}</p>}

      <ul className="space-y-1 mt-2 w-full max-h-64 overflow-y-auto border rounded-lg p-4 bg-card">
        {messages.map((msg, i) => (
          <li key={i} className="font-mono text-sm">
            {JSON.stringify(msg)}
          </li>
        ))}
      </ul>
    </section>
  );
};
