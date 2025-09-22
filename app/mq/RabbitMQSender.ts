import type { Connection, Channel, ConsumeMessage } from "amqplib";
import type { RabbitMQConfig } from "./RabbitMQConfig";
import { getMQConnection } from "./getMQConnection";

export class RabbitMQSender {
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
      this.conn = await getMQConnection();
      this.channel = await this.conn.createChannel();

      if (this.queue) {
        await this.channel.assertQueue(this.queue, { durable: true });

        if (this.exchange) {
          await this.channel.assertExchange(
            this.exchange,
            this.exchangeType || "direct",
            { durable: true }
          );

          await this.channel.bindQueue(
            this.queue,
            this.exchange,
            this.routingKey || "routing_key"
          );
        }
      }
    } catch (err) {
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    await this.channel.close();
    await this.conn.close();
  }

  async sendMessage(msg: object, routingKey?: string): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel is not initialized. Call connect() first.");
    }

    const msgBuffer = Buffer.from(JSON.stringify(msg));

    if (this.exchange) {
      const key = routingKey || this.routingKey || "";
      this.channel.publish(this.exchange, key, msgBuffer, {
        persistent: true,
      });
    } else if (this.queue) {
      this.channel.sendToQueue(this.queue, msgBuffer, {
        persistent: true,
      });
    } else {
      throw new Error("No exchange or queue configured to send messages.");
    }
  }
}
