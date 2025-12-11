export interface RabbitMQConfig {
  queue: string; // optional queue name
  exchange?: string; // optional exchange name
  exchangeType?: "direct" | "fanout" | "topic" | "headers";
  routingKey?: string; // optional routing key
}
