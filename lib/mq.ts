import type { RabbitMQConfig } from "@/app/mq/RabbitMQConfig";
import "dotenv/config";
import { RabbitMQSender } from "@/app/mq/RabbitMQSender";
import { RabbitMQReceiver } from "@/app/mq/RabbitMQReceiver";

let started = false;

export async function startMessageQueues() {
    if (started) return;
    started = true;
    
    console.log("Starting message queues");
  // Example configuration
  const config: RabbitMQConfig = {
    queue: "my_queue",
  };

  // Create sender
  const sender = new RabbitMQSender(config);
  await sender.connect();

  // Create receiver
  const receiver = new RabbitMQReceiver(config);
  await receiver.connect();

  // Start consuming messages
  await receiver.consumeMessages((msg) => {
    console.log("Received message in main:", msg);
  });

  // Example: send a test message every 2 seconds
  setInterval(async () => {
    await sender.sendMessage({
      JobID: 4,
      Result: { Stdout: "4\n", Stderr: "", Err: null },
    });
  }, 5000);

  console.log("MQ system running. Press CTRL+C to exit.");
}

startMessageQueues().catch((err) => {
  console.error("Error starting MQ system:", err);
});
