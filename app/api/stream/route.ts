import { NextResponse } from "next/server";

type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
};

const clients: Map<string, Set<Client>> = new Map();

function addClient(userId: string, client: Client) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId)!.add(client);
}

function removeClient(userId: string, client: Client) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(client);
  if (set.size === 0) clients.delete(userId);
}

export async function GET(req: Request) {
  const {data:session} = useSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  let stopped = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const client: Client = { controller, encoder };
      addClient(userId, client);
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ status: "connected" })}\n\n`)
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
