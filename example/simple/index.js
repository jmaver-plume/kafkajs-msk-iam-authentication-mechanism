const { Kafka } = require('kafkajs')
const { awsIamAuthenticator, Type } = require('../../src')

const kafka = new Kafka({
  brokers: process.env.BROKERS.split(','),
  clientId: 'consumer',
  ssl: true,
  sasl: {
    mechanism: Type,
    authenticationProvider: awsIamAuthenticator(process.env.REGION, process.env.TTL)
  }
})

async function run () {
  const admin = kafka.admin()
  await admin.connect()
  const topics = await admin.listTopics()
  console.log('Topics: ', topics)
  await admin.disconnect()
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error: ', err)
    process.exit(1)
  })
