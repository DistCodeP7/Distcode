import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/user";

type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
};

const clients: Map<number, Set<Client>> = new Map();

function addClient(userId: number, client: Client) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId)!.add(client);
}

function removeClient(userId: number, client: Client) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(client);
  if (set.size === 0) clients.delete(userId);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getUserIdByEmail(session.user.email)
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  console.log(`User ${userId} connected to SSE`);

  const encoder = new TextEncoder();
  let stopped = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const client: Client = { controller, encoder };
      addClient(userId, client);
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ status: `connected ${userId}` })}\n\n`)
      );
    },
    cancel() {
      stopped = true;
      removeClient(userId, { controller: null! as any, encoder });
    },
  });

  const heartbeat = setInterval(() => {
    if (stopped) {
      clearInterval(heartbeat);
      return;
    }

    const userClients = clients.get(userId);
    userClients?.forEach((client) => {
      try {
        client.controller.enqueue(encoder.encode(":\n\n"));
      } catch {
        removeClient(userId, client);
      }
    });
  }, 15000);

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export { clients, addClient, removeClient };
