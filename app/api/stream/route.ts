import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/user";
import { RabbitMQReceiver } from "@/app/mq/RabbitMQReceiver";

type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
};

type JobResultMessage = {
  JobId: number;
  Result: {
    Stdout: string;
    Stderr: string;
    Err: string;
  };
  UserId?: number;
};

class JobResultQueueListener {
  private mqReceiver: RabbitMQReceiver;
  private isRunning: boolean = false;

  constructor(mqReceiver = new RabbitMQReceiver({ queue: "results" })) {
    this.mqReceiver = mqReceiver;
    this.isRunning = false;
  }

  start<T>(messageCallback: (msg: T) => void) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.mqReceiver.connect().then(() => {
      this.mqReceiver.consumeMessages(messageCallback);
    });
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.mqReceiver.disconnect();
  }
}

class ClientManager {
  private clients: Map<number, Set<Client>> = new Map();
  private heartBeatId: NodeJS.Timeout | undefined = undefined;

  addClient(userId: number, client: Client) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(client);

    if (this.clients.size === 1 && !this.heartBeatId) {
      this.heartBeatId = setInterval(() => this.heartbeat(), 15000);
    }
  }

  removeClient(userId: number, client: Client) {
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

  dispatchJobResultToClients(msg: JobResultMessage) {
    const userId = msg.UserId;
    if (!userId) return;

    const userClients = this.clients.get(userId);
    if (!userClients) return;

    for (const client of userClients) {
      try {
        client.controller.enqueue(
          client.encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)
        );
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
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
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
      clientManager.addClient(userId, client);
    },
    cancel: () => {
      clientManager.removeClient(userId, clientRef);
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
