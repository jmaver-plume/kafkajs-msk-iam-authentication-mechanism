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
    authenticationProvider: awsIamAuthenticator(process.env.REGION, process.env.TTL)
  }
})

const producer = kafka.producer()
const admin = kafka.admin()

app.use(express.json())

app.use((req, res, next) => {
  console.log({
    body: req.body,
    path: req.path,
    method: req.method
  })
  next()
})

app.use((req, res, next) => {
  req.producer = producer
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
    await admin.createTopics({
      topics: kafkaTopics
    })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

app.post('/', async (req, res) => {
  try {
    const { body: { message, topic } } = req
    if (!message || !topic) {
      return res.sendStatus(400)
    }

    await req.producer.send({
      topic,
      messages: [
        { value: JSON.stringify(message) }
      ]
    })
    res.send('Hello World!')
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
