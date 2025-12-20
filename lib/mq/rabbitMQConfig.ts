interface RabbitMQBaseConfig {
  exchange?: string;
  exchangeType?: "direct" | "fanout" | "topic" | "headers";
  routingKey?: string;
}

export interface RabbitMQSenderConfig extends RabbitMQBaseConfig {
  queue?: string;
}

export interface RabbitMQConsumerConfig extends RabbitMQBaseConfig {
  queue: string;
}
