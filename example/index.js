require('dotenv').config()
const { Kafka, AuthenticationMechanisms } = require('kafkajs')
const { Mechanism, Type } = require('../src/sdk');
AuthenticationMechanisms[Type] = () => Mechanism;

const kafka = new Kafka({
    brokers: process.env.BROKERS.split(','),
    clientId: 'consumer',
    ssl: true,
    sasl: {
        mechanism: Type
    },
})

async function run () {
    const admin = kafka.admin()
    await admin.connect()
    const topics = await admin.listTopics();
    console.log('Topics: ', topics)
    await admin.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
      console.error('Error: ', err)
      process.exit(1)
  })