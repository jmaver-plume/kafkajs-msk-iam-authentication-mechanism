# Kafka MSK IAM integration

## Installation

You need to have `"kafkajs": "^2.2.0-beta.0"` installed.

For more information look at https://github.com/tulios/kafkajs/issues/840#issuecomment-1177251826.

```shell
npm i kafkajs-msk-iam-authentication-mechanism 
```

### Setup

```javascript
const { Kafka } = require('kafkajs')
const {
  awsIamAuthenticator,
  Type
} = require('kafkajs-msk-iam-authentication-mechanism')

const kafka = new Kafka({
  brokers: process.env.BROKERS.split(','),
  clientId: 'consumer',
  ssl: true,
  sasl: {
    mechanism: Type,
    authenticationProvider: awsIamAuthenticator(process.env.REGION, process.env.TTL)
  }
})
```

## Examples

For working examples look at `example` folder.

