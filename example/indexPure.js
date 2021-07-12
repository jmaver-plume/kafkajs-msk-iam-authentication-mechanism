require('dotenv').config()
const { Kafka, AuthenticationMechanisms } = require('kafkajs')
const AWS_MSK_IAM_MECHANISM = 'AWS_MSK_IAM'
AuthenticationMechanisms[AWS_MSK_IAM_MECHANISM] = () => require('../src/pure');

if (!process.env.BROKERS) {
  console.error('Missing value process.env.BROKERS');
  process.exit(1);
}
//
// if (!process.env.REGION) {
//     console.error('Missing value process.env.REGION');
//     process.exit(1);
// }

const kafka = new Kafka({
  brokers: process.env.BROKERS.split(','),
  clientId: 'consumer',
  ssl: true,
  sasl: {
    mechanism: 'AWS_MSK_IAM'
  },
})

function index () {
  const admin = kafka.admin()
  admin.connect()
    .then(() => console.log('topics: ', admin.listTopics()))
    .catch((err) => {
      console.error('Kafka admin error: ', err)
      process.exit(1)
    })
}

index()