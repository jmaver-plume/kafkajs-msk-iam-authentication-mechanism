# Kafka MSK IAM integration

KafkaJS custom authentication mechanism for AWS MSK IAM.

## Installation

Requires `kafkajs` version `2.2.0` or higher.

```shell
npm i @jm18457/kafkajs-msk-iam-authentication-mechanism
```

## Usage

```javascript
const { Kafka } = require("kafkajs");
const {
  createMechanism,
} = require("@jm18457/kafkajs-msk-iam-authentication-mechanism");

const kafka = new Kafka({
  brokers: ["kafka1:9092", "kafka2:9092"],
  clientId: "my-app",
  ssl: true,
  sasl: createMechanism({ region: "eu-central-1" }),
});
```

You can also pass AWS credentials explicitly. If you do not provide
credentials, the library uses the AWS SDK default credential provider chain.

```javascript
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");

const kafka = new Kafka({
  brokers: ["kafka1:9092", "kafka2:9092"],
  clientId: "my-app",
  ssl: true,
  sasl: createMechanism({
    region: "eu-central-1",
    credentials: fromNodeProviderChain(),
  }),
});
```

## Examples

For working examples look at the `examples` folder.

## API

### createMechanism(options)

Creates a KafkaJS SASL mechanism object for AWS MSK IAM authentication.

```javascript
sasl: createMechanism({
  region: "eu-central-1",
});
```

### Options

| Option        | Type                                                       | Required | Default                   | Description                                              |
| ------------- | ---------------------------------------------------------- | -------- | ------------------------- | -------------------------------------------------------- |
| `region`      | `string`                                                   | Yes      | -                         | AWS region where the MSK cluster exists.                 |
| `ttl`         | `string`                                                   | No       | `"900"`                   | Presigned authentication payload lifetime in seconds.    |
| `userAgent`   | `string`                                                   | No       | `"MSK_IAM"`               | User agent value included in the authentication payload. |
| `credentials` | `AwsCredentialIdentity \| Provider<AwsCredentialIdentity>` | No       | `fromNodeProviderChain()` | AWS credentials or an AWS credentials provider.          |
