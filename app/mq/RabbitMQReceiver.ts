import amqp from "amqplib";
import type { Connection, Channel, ConsumeMessage } from "amqplib";
import type { RabbitMQConfig } from "./RabbitMQConfig";
import { getMQConnection } from "./getMQConnection.ts";

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
    try {
      this.conn = await getMQConnection()
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

      console.log(
        `Receiver connected: Queue ${this.queue}` +
          (this.exchange ? ` on Exchange ${this.exchange}` : "")
      );
    } catch (err) {
      console.error("Failed to connect receiver:", err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.conn) await this.conn.close();
    console.log(
      `Receiver disconnected: Queue ${this.queue}` +
        (this.exchange ? ` on Exchange ${this.exchange}` : "")
    );
  }

  async consumeMessages(onMessage: (msg: any) => void): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized. Call connect() first.");
    }

    if (!this.queue) {
      throw new Error("Queue not configured for receiving messages.");
    }

    await this.channel.consume(
      this.queue,
      (msg: ConsumeMessage | null) => {
        if (msg) {
          const content = msg.content.toString();
          try {
            onMessage(JSON.parse(content));
          } catch {
            onMessage(content);
          }
          this.channel.ack(msg);
        }
      }
    );

    console.log(`Waiting for messages in queue "${this.queue}"...`);
  }
}
