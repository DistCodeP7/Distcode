// app/mq/index.ts
import { RabbitMQReceiver } from "@/app/mq/RabbitMQReceiver";
import { RabbitMQSender } from "@/app/mq/RabbitMQSender";

const sender = new RabbitMQSender({
  queue: "jobs",
});
const receiver = new RabbitMQReceiver({
  queue: "results",
});

async function init() {
  await sender.connect();
  await receiver.connect();
}

const ready = init();

export { sender as MQJobsSender, receiver as MQJobsReceiver, ready };
