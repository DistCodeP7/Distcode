import amqp from "amqplib";

(async () => {
    try {
        const connection = await amqp.connect("amqp://localhost");
        console.log("Connected");

        const channel = await connection.createChannel();
        console.log("Channel created");

        //const exchange = "my_exchange";
        const queue = "my_queue";
        //const routingKey = "my_routing_key";

        await channel.assertQueue(queue, { durable: true });
        
        //await channel.assertExchange(exchange, "direct", { durable: true });
        
        //await channel.bindQueue(queue, exchange, routingKey);

        //console.log(` [*] Waiting for messages in queue "${queue}" bound to exchange "${exchange}" with key "${routingKey}".`);

        channel.consume(queue, (msg) => {
            if (msg) {
                console.log(" [x] Received %s", msg.content.toString());
            }
        }, { noAck: true });
    } catch (err) {
        console.error(err);
    }
})();