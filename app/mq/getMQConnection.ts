import amqp from "amqplib";
import type { Connection } from "amqplib";

const connection = null;

export async function getMQConnection(): Promise<Connection> {
    if (connection) {
        return connection;
    }
    try {
        const connectionUrl = process.env.RABBITMQ_URL;
        console.log(connectionUrl);
        if (!connectionUrl) {
            throw new Error("RabbitMQ connection URL is not provided.");
        }
        const conn: Connection = await amqp.connect(connectionUrl);
        return conn;
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
}