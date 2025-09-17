
import amqp from "amqplib";
import type {Connection, Channel, ConsumeMessage} from 'amqplib';
import type {RabbitMQConfig} from "./RabbitMQConfig";

export class RabbitMQSender {
    private conn!: Connection;
    private channel!: Channel;
    private config: RabbitMQConfig;
    
    constructor(config: RabbitMQConfig) {
        this.config = config;
    };
    
    async connect(): Promise<void> {
        try {
            this.conn = await amqp.connect(this.config.url);
            this.channel = await this.conn.createChannel();

            if (this.config.queue) {
                await this.channel.assertQueue(
                    this.config.queue,
                    { durable: true }
                )

                if (this.config.exchange) {
                    await this.channel.assertExchange(
                        this.config.exchange,
                        this.config.exchangeType || "direct",
                        { durable: true }
                    )
                    
                    await this.channel.bindQueue(
                        this.config.queue, 
                        this.config.exchange, 
                        this.config.routingKey || "")
                }

                console.log(`Connected: Queue ${this.config.queue}` +
                    (this.config.exchange ? ` on Exchange ${this.config.exchange}` : ""));
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async disconnect(): Promise<void> {
        await this.channel.close();
        await this.conn.close();
        console.log(`Disconnected: Queue ${this.config.queue}` +
            (this.config.exchange ? ` on Exchange ${this.config.exchange}` : ""));
    }
    
    async sendMessage(msg: object, routingKey?: string): Promise<void> {
        if (!this.channel) {
            throw new Error("Channel is not initialized. Call connect() first.");
        }

        const msgBuffer = Buffer.from(JSON.stringify(msg));
        
        if (this.config.exchange) {
            const key = routingKey || this.config.routingKey || "";
            this.channel.publish(this.config.exchange, key, msgBuffer, { persistent: true });
            console.log(`Message ${msgBuffer} sent to exchange "${this.config.exchange}" with key "${key}"`);
        }
        else if (this.config.queue) {
            this.channel.sendToQueue(this.config.queue, msgBuffer, { persistent: true });
            console.log(`Message ${msgBuffer} sent to queue "${this.config.queue}"`);
        }
        else {
            throw new Error("No exchange or queue configured to send messages.")
        }
    }

    async consumeMessage(onMessage: (msg: any) => void): Promise<void> {
        await this.channel.consume(this.config.queue, (msg: ConsumeMessage | null) => {
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

// Test message
(async () => {
    const sender = new RabbitMQSender({
        url: "amqp://localhost",
        queue: "my_queue",
        routingKey: "my_routing_key",
    });

    await sender.connect();
    await sender.sendMessage({"test":"test"});
    
    //Keep running or disconnect later
    //await sender.disconnect();
})();
