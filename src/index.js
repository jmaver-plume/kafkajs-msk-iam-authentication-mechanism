"use strict";
require('dotenv').config();
const { Kafka, AuthenticationMechanisms } = require('kafkajs');
const AWS_MSK_IAM_MECHANISM = 'AWS_MSK_IAM';
AuthenticationMechanisms[AWS_MSK_IAM_MECHANISM] = () => require('./authenticator');
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
});
function handleProducer() {
    const producer = kafka.producer();
    producer.connect()
        .then(() => producer.send({ topic: 'test1', messages: [{ value: 'test message' }] }))
        .then(() => producer.disconnect())
        .catch((err) => {
        console.error('Producer main error: ', err);
        process.exit(1);
    });
}
function handleTopics() {
    const admin = kafka.admin();
    admin.connect()
        .then(() => console.log('topics: ', admin.listTopics()))
        .catch((err) => {
        console.error('Kafka admin error: ', err);
        process.exit(1);
    });
}
handleTopics();
