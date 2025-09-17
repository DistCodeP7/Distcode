import amqp from "amqplib";
import type { Connection, Channel, ConsumeMessage } from "amqplib";
import type { RabbitMQConfig } from "./RabbitMQConfig";

export class RabbitMQReceiver {
    private conn!: Connection;
    private channel!: Channel;
    private config: RabbitMQConfig;

    constructor(config: RabbitMQConfig) {
        this.config = config;
    }

    async connect(): Promise<void> {
        try {
            this.conn = await amqp.connect(this.config.url);
            this.channel = await this.conn.createChannel();

            // Always assert queue
            if (this.config.queue) {
                await this.channel.assertQueue(this.config.queue, { durable: true });
            }

            // Optionally assert and bind exchange
            if (this.config.exchange) {
                await this.channel.assertExchange(
                    this.config.exchange,
                    this.config.exchangeType || "direct",
                    { durable: true }
                );

                if (this.config.queue) {
                    await this.channel.bindQueue(
                        this.config.queue,
                        this.config.exchange,
                        this.config.routingKey || ""
                    );
                }
            }

            console.log(
                `Receiver connected: Queue ${this.config.queue}` +
                (this.config.exchange ? ` on Exchange ${this.config.exchange}` : "")
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
            `Receiver disconnected: Queue ${this.config.queue}` +
            (this.config.exchange ? ` on Exchange ${this.config.exchange}` : "")
        );
    }

    async consumeMessages(onMessage: (msg: any) => void): Promise<void> {
        if (!this.channel) {
            throw new Error("Channel not initialized. Call connect() first.");
        }

        if (!this.config.queue) {
            throw new Error("Queue not configured for receiving messages.");
        }

        await this.channel.consume(
            this.config.queue,
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

        console.log(`Waiting for messages in queue "${this.config.queue}"...`);
    }
}

// Test message
(async () => {
    const receiver = new RabbitMQReceiver({
        url: "amqp://localhost",
        queue: "my_queue",
        routingKey: "my_routing_key",
    });

    await receiver.connect();

    await receiver.consumeMessages((msg) => {
        console.log("Received message:", msg);
    });

    // Keep running or disconnect
    // await receiver.disconnect();
})();