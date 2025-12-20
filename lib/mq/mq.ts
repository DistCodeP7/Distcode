import { RabbitMQReceiver } from "./rabbitMQReceiver";
import { ExchangePublisher, QueueSender } from "./rabbitMQSender";

const sender = new QueueSender("jobs");

const receiver = new RabbitMQReceiver({
  queue: "results",
});

const canceller = new ExchangePublisher("jobs.cancel", "fanout");

async function init() {
  await Promise.all([
    sender.connect(),
    receiver.connect(),
    canceller.connect(),
  ]);
}

const ready = init();

export {
  canceller as MQJobsCanceller,
  receiver as MQJobsReceiver,
  sender as MQJobsSender,
  ready,
};
