export interface RabbitMQConfig {
  queue: string;
  exchange?: string;
  exchangeType?: "direct" | "fanout" | "topic" | "headers";
  routingKey?: string;
}
