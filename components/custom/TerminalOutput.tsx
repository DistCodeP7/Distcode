"use client";
import type {
  StreamingJobResult,
  StreamingJobResultEvent,
} from "@/app/api/stream/route";
import { Virtuoso } from "react-virtuoso";

type TerminalOutputProps = {
  messages: StreamingJobResult[];
};

export const TerminalOutput = ({ messages }: TerminalOutputProps) => {
  // Flatten messages into a list of events with a reference to their job
  const flattenedEvents = messages.flatMap((msg) =>
    msg.Events.map((event, idx) => ({
      event,
      jobId: msg.JobId,
      sequenceIndex: msg.SequenceIndex,
      eventIndex: idx,
    }))
  );

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
      <Virtuoso
        totalCount={flattenedEvents.length}
        itemContent={(index) => {
          const item = flattenedEvents[index];
          return (
            <div
              key={`${item.jobId}-${item.sequenceIndex}-${item.eventIndex}`}
              className="mb-1"
            >
              {renderEventText(item.event)}
            </div>
          );
        }}
      />
    </div>
  );
};
