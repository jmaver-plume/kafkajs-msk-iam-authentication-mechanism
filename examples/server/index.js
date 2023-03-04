const { Kafka } = require('kafkajs')
const {
  awsIamAuthenticator,
  Type
} = require('../../src')
const express = require('express')
const app = express()

const port = process.env.PORT || 3000

const kafka = new Kafka({
  brokers: process.env.BROKERS.split(','),
  clientId: 'consumer',
  ssl: true,
  sasl: {
    mechanism: Type,
    authenticationProvider: awsIamAuthenticator({ region: process.env.REGION })
  }
})

const admin = kafka.admin()
const consumer = kafka.consumer({ groupId: 'server' })
const producer = kafka.producer()

app.use(express.json())

app.use((req, res, next) => {
  console.log({
    body: req.body,
    path: req.path,
    method: req.method
  })
  next()
})

app.post('/provision', async (req, res) => {
  try {
    const { body: { topics } } = req
    if (!topics) {
      return res.sendStatus(400)
    }
    const kafkaTopics = topics.map(topic => ({ topic }))
    await admin.connect()
    console.log('Successfully connected.')
    await admin.createTopics({
      topics: kafkaTopics
    })
    console.log('Successfully created topics.', { topics: kafkaTopics })
    res.sendStatus(200)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

app.post('/topic', async (req, res) => {
  try {
    const { body: { topic } } = req
    if (!topic) {
      return res.sendStatus(400)
    }
    await admin.connect()
    console.log('Successfully connected using admin client.')
    await admin.createTopics({
      topics: [{ topic }]
    })
    console.log(`Successfully created a topic with name ${topic}`)
    res.sendStatus(200)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

app.post('/subscribe', async (req, res) => {
  try {
    const { body: { topic } } = req
    if (!topic) {
      return res.sendStatus(400)
    }

    await consumer.connect()
    await consumer.subscribe({ topics: [topic] })
    console.log(`Successfully subscribed to topic ${topic}.`)
    await consumer.run({
      eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
        console.log({
          topic,
          value: message.value.toString(),
          partition
        })
      }
    })
    res.sendStatus(200)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

app.post('/message', async (req, res) => {
  try {
    const { body: { message, topic } } = req
    if (!message || !topic) {
      return res.sendStatus(400)
    }

    await producer.send({
      topic,
      messages: [
        { value: JSON.stringify(message) }
      ]
    })
    res.sendStatus(200)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

async function run () {
  await producer.connect()
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
}

run().catch(console.error)
