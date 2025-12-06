// app/mq/index.ts
import { RabbitMQReceiver } from "@/app/mq/RabbitMQReceiver";
import { RabbitMQSender } from "@/app/mq/RabbitMQSender";

const sender = new RabbitMQSender({
  queue: "jobs",
});
const receiver = new RabbitMQReceiver({
  queue: "results",
});
const canceller = new RabbitMQSender({
  queue: "jobs_cancel",
});

async function init() {
  await sender.connect();
  await receiver.connect();
  await canceller.connect();
}

const ready = init();

export {
  sender as MQJobsSender,
  receiver as MQJobsReceiver,
  canceller as MQJobsCanceller,
  ready,
};
