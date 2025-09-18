import { NextResponse } from "next/server";
import { RabbitMQReceiver } from "@/app/mq/RabbitMQReceiver";

export async function GET() {
  const encoder = new TextEncoder();
  let stopped = false;

  const receiver = new RabbitMQReceiver({
    url: "amqp://localhost",
    queue: "results",
  });

  const stream = new ReadableStream({
    async start(controller) {
      const cleanup = () => {
        stopped = true;
        receiver.disconnect().catch(console.error);
        controller.close();
      };

      try {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ status: "connected" })}\n\n`,
          ),
        );

        await receiver.connect();

        await receiver.consumeMessages((msg) => {
          if (stopped) return;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(msg)}\n\n`),
          );
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        console.error("SSE error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ status: "error", message })}\n\n`,
          ),
        );
        cleanup();
      }
    },
    cancel() {
      stopped = true;
      receiver.disconnect().catch(console.error);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
