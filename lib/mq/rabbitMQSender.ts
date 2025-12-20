import { getMQConnection } from "@/lib/mq/getMQConnection";
import type { Channel, Connection } from "amqplib";

abstract class BaseRabbitMQSender {
  protected conn!: Connection;
  protected channel!: Channel;

  async connect(): Promise<void> {
    this.conn = await getMQConnection();
    this.channel = await this.conn.createChannel();
  }

  async disconnect(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.conn) await this.conn.close();
  }

  protected ensureChannel() {
    if (!this.channel) {
      throw new Error("Channel not initialized. Call connect() first.");
    }
  }
}

export class QueueSender extends BaseRabbitMQSender {
  constructor(private queue: string) {
    super();
  }

  async connect(): Promise<void> {
    await super.connect();

    await this.channel.assertQueue(this.queue, { durable: true });
  }

  async send(msg: object): Promise<void> {
    this.ensureChannel();
    const buffer = Buffer.from(JSON.stringify(msg));
    this.channel.sendToQueue(this.queue, buffer, { persistent: true });
  }

  async getQueueMetrics(): Promise<{
    messageCount: number;
    consumerCount: number;
  }> {
    this.ensureChannel();
    const { messageCount, consumerCount } = await this.channel.checkQueue(
      this.queue
    );
    return { messageCount, consumerCount };
  }
}

export class ExchangePublisher extends BaseRabbitMQSender {
  constructor(
    private exchange: string,
    private type: "fanout" | "direct" | "topic" = "fanout"
  ) {
    super();
  }

  async connect(): Promise<void> {
    await super.connect();
    await this.channel.assertExchange(this.exchange, this.type, {
      durable: true,
    });
  }

  async publish(msg: object, routingKey: string = ""): Promise<void> {
    this.ensureChannel();
    const buffer = Buffer.from(JSON.stringify(msg));
    this.channel.publish(this.exchange, routingKey, buffer, {
      persistent: true,
    });
  }
}
