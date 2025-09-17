import { NextResponse } from "next/server";

export async function GET() {
  const encoder = new TextEncoder();
  let progress = 0;
  let stopped = false;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ status: "started" })}\n\n`),
      );

      const interval = setInterval(() => {
        if (stopped) {
          clearInterval(interval);
          return;
        }

        progress += 20;

        if (progress < 100) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ status: "running", progress })}\n\n`,
            ),
          );
        } else {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ status: "done" })}\n\n`),
          );
          clearInterval(interval);
          stopped = true;
          controller.close();
        }
      }, 1000);
    },
    cancel() {
      stopped = true; // if client disconnects
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
