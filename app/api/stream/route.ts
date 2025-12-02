import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { RabbitMQReceiver } from "@/app/mq/RabbitMQReceiver";
import type {
  StreamingEvent,
  StreamingJobMessage,
} from "@/types/streamingEvents";
import { authOptions } from "../auth/[...nextauth]/route";

type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
};

class JobResultQueueListener {
  private mqReceiver: RabbitMQReceiver;
  private isRunning = false;

  constructor(mqReceiver = new RabbitMQReceiver({ queue: "results" })) {
    this.mqReceiver = mqReceiver;
  }

  start(messageCallback: (msg: StreamingJobMessage) => void) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.mqReceiver.connect().then(() => {
      this.mqReceiver.consumeMessages(
        messageCallback as (msg: Record<string, unknown>) => void
      );
    });
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.mqReceiver.disconnect();
  }
}

class ClientManager {
  private clients: Map<string, Set<Client>> = new Map();
  private heartBeatId: NodeJS.Timeout | undefined = undefined;

  addClient(userId: string, client: Client) {
    let userClients = this.clients.get(userId);

    if (!userClients) {
      userClients = new Set<Client>();
      this.clients.set(userId, userClients);
    }

    userClients.add(client);

    if (this.clients.size === 1 && !this.heartBeatId) {
      this.heartBeatId = setInterval(() => this.heartbeat(), 15000);
    }
  }

  removeClient(userId: string, client: Client) {
    const set = this.clients.get(userId);
    if (!set) return;
    set.delete(client);
    if (set.size === 0) this.clients.delete(userId);
    if (this.clients.size === 0) {
      clearInterval(this.heartBeatId);
      this.heartBeatId = undefined;
    }
  }

  hasClients(): boolean {
    return this.clients.size > 0;
  }

  heartbeat() {
    for (const [userId, userClients] of this.clients) {
      for (const client of userClients) {
        try {
          client.controller.enqueue(client.encoder.encode(":\n\n"));
        } catch {
          this.removeClient(userId, client);
        }
      }
    }
  }

  dispatchJobResultToClients(msg: StreamingJobMessage) {
    console.log("Dispatching job result to clients:", msg);

    const userId = msg.user_id;
    if (!userId) return;

    const userClients = this.clients.get(userId);
    if (!userClients) return;

    const payload = `data: ${JSON.stringify(msg)}\n\n`;

    for (const client of userClients) {
      try {
        client.controller.enqueue(client.encoder.encode(payload));
      } catch {
        this.removeClient(userId, client);
      }
    }
  }
}

const clientManager = new ClientManager();
const jobResultListener = new JobResultQueueListener();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  jobResultListener.start(
    clientManager.dispatchJobResultToClients.bind(clientManager)
  );

  const encoder = new TextEncoder();
  let clientRef: Client;

  const stream = new ReadableStream<Uint8Array>({
    start: (controller) => {
      const client: Client = { controller, encoder };
      clientRef = client;
      clientManager.addClient(session.user.id, client);

      // Optional: send a "connected" log using the *new* shape
      const initial: StreamingJobMessage = {
        job_uid: "initial-" + session.user.id,
        user_id: session.user.id,
        events: [
          {
            kind: "log",
            worker_id: "",
            message: "Connected to stream.",
          } satisfies StreamingEvent,
        ],
      };

      clientManager.dispatchJobResultToClients(initial);
    },
    cancel: () => {
      clientManager.removeClient(session.user.id, clientRef);
      if (!clientManager.hasClients()) jobResultListener.stop();
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
