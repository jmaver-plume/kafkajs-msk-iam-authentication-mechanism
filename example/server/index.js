const { Kafka, AuthenticationMechanisms } = require('kafkajs')
const express = require('express')
const app = express()
const { Mechanism, Type } = require('../../src')
AuthenticationMechanisms[Type] = () => Mechanism

const port = process.env.PORT || 3000

const kafka = new Kafka({
  brokers: process.env.BROKERS.split(','),
  clientId: 'consumer',
  ssl: true,
  sasl: {
    mechanism: Type,
    region: process.env.REGION,
    ttl: process.env.TTL
  }
})

const producer = kafka.producer()

app.use((req, res, next) => {
  res.producer = producer
  next()
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
