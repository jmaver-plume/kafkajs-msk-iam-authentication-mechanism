const { Kafka } = require("kafkajs");
const {
  createMechanism,
} = require("@jm18457/kafkajs-msk-iam-authentication-mechanism");

const kafka = new Kafka({
  brokers: process.env.BROKERS.split(","),
  clientId: "consumer",
  ssl: true,
  sasl: createMechanism({ region: process.env.REGION }),
});

async function run() {
  const admin = kafka.admin();
  await admin.connect();
  const topics = await admin.listTopics();
  console.log("Topics: ", topics);
  await admin.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error: ", err);
    process.exit(1);
  });
