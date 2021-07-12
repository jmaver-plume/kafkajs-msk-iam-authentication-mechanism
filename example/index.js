require('dotenv').config()
const { Kafka, AuthenticationMechanisms } = require('kafkajs')
const AWS_MSK_IAM_MECHANISM = 'aws_msk_iam'
AuthenticationMechanisms[AWS_MSK_IAM_MECHANISM] = () => require('../src/sdk');

const kafka = new Kafka({
    brokers: process.env.BROKERS.split(','),
    clientId: 'consumer',
    ssl: true,
    sasl: {
        mechanism: AWS_MSK_IAM_MECHANISM
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