import type { Channel, Connection, ConsumeMessage } from "amqplib";
import { getMQConnection } from "./getMQConnection";
import type { RabbitMQConfig } from "./RabbitMQConfig";

export class RabbitMQReceiver {
  private conn!: Connection;
  private channel!: Channel;
  private queue: string;
  private exchange?: string;
  private exchangeType: string;
  private routingKey?: string;

  constructor(RabbitMQConfig: RabbitMQConfig) {
    this.queue = RabbitMQConfig.queue;
    this.exchange = RabbitMQConfig.exchange;
    this.exchangeType = RabbitMQConfig.exchangeType || "direct";
    this.routingKey = RabbitMQConfig.routingKey;
  }

  async connect(): Promise<void> {
    this.conn = await getMQConnection();
    this.channel = await this.conn.createChannel();

    // Always assert queue
    if (this.queue) {
      await this.channel.assertQueue(this.queue, { durable: true });
    }

    // Optionally assert and bind exchange
    if (this.exchange) {
      await this.channel.assertExchange(
        this.exchange,
        this.exchangeType || "direct",
        { durable: true }
      );

      if (this.queue) {
        await this.channel.bindQueue(
          this.queue,
          this.exchange,
          this.routingKey || ""
        );
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.conn) await this.conn.close();
  }

  async consumeMessages(onMessage: (msg: unknown) => void): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized. Call connect() first.");
    }

    if (!this.queue) {
      throw new Error("Queue not configured for receiving messages.");
    }

    await this.channel.consume(this.queue, (msg: ConsumeMessage | null) => {
      if (msg) {
        const content = msg.content.toString();
        try {
          onMessage(JSON.parse(content));
        } catch {
          onMessage(content);
        }
        this.channel.ack(msg);
      }
    });
  }
}
