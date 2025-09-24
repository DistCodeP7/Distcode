"use client";
import {
  StreamingJobResult,
  StreamingJobResultEvent,
} from "@/app/api/stream/route";

type TerminalOutputProps = {
  messages: StreamingJobResult[];
};
export const TerminalOutput = ({ messages }: TerminalOutputProps) => {
  function renderEventText(e: StreamingJobResultEvent) {
    switch (e.Kind) {
      case "stdout":
        return <span className="text-green-600">{e.Message}</span>;
      case "stderr":
        return <span className="text-yellow-600">{e.Message}</span>;
      case "error":
        return <span className="text-red-600">{e.Message}</span>;
      default:
        return <span>{e.Message}</span>;
    }
  }

  return (
    <div className="h-full w-full bg-muted text-sm text-muted-foreground">
      <div className="p-4 h-full overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <div className="mb-1 font-semibold">Job ID: {msg.JobId}</div>
            {msg.Events.map((event, idx) => (
              <div key={idx}>{renderEventText(event)}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
