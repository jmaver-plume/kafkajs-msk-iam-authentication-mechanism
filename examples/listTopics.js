require('dotenv').config()
const { Kafka, AuthenticationMechanisms } = require('kafkajs')
const AWS_MSK_IAM_MECHANISM = 'AWS_MSK_IAM'
AuthenticationMechanisms[AWS_MSK_IAM_MECHANISM] = () => require('../build/main');

if (!process.env.BROKERS) {
    console.error('Missing value process.env.BROKERS');
    process.exit(1);
}

const kafka = new Kafka({
    brokers: process.env.BROKERS.split(','),
    clientId: 'consumer',
    ssl: true,
    sasl: {
        mechanism: AWS_MSK_IAM_MECHANISM,
    },
})

function listTopics () {
    const admin = kafka.admin()
    admin.connect()
        .then(() => console.log('topics: ', admin.listTopics()))
        .catch((err) => {
            console.error('Kafka admin error: ', err)
            process.exit(1)
        })
}

listTopics()