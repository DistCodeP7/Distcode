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
      // Handle client disconnect
      const cleanup = () => {
        stopped = true;
        receiver.disconnect().catch(console.error);
        controller.close();
      };

      try {
        // Initial "connected" message
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ status: "connected" })}\n\n`,
          ),
        );

        // Connect to RabbitMQ
        await receiver.connect();

        // Start consuming messages
        await receiver.consumeMessages((msg) => {
          if (stopped) return;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(msg)}\n\n`),
          );
        });
      } catch (err) {
        if (err instanceof Error) {
          console.error("SSE error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ status: "error", message: err.message })}\n\n`,
            ),
          );
        } else {
          console.error("SSE error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ status: "error", message: "Unknown error occurred" })}\n\n`,
            ),
          );
        }
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
      "Access-Control-Allow-Origin": "*", // optional if CORS needed
    },
  });
}
