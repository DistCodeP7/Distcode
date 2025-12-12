import type { Connection } from "amqplib";
import amqp from "amqplib";

export async function getMQConnection(): Promise<Connection> {
  return process.env.RABBITMQ_URL
    ? await amqp.connect(process.env.RABBITMQ_URL)
    : Promise.reject("RABBITMQ_URL is not defined");
}
