# Kafka MSK IAM integration

## Installation

Requires `kafkajs` version `2.2.0` or higher.

For more information look at https://kafka.js.org/docs/next/configuration#custom-authentication-mechanisms.

```shell
npm i @jm18457/kafkajs-msk-iam-authentication-mechanism 
```

### Setup

```javascript
const { Kafka } = require('kafkajs')
const {
  awsIamAuthenticator,
  Type
} = require('@jm18457/kafkajs-msk-iam-authentication-mechanism')
const { fromNodeProviderChain } = require('@aws-sdk/credential-providers')

const provider = awsIamAuthenticator({
    region: 'eu-central-1'
})

const kafka = new Kafka({
  brokers: ['kafka1:9092', 'kafka2:9092'],
  clientId: 'my-app',
  ssl: true,
  sasl: {
    mechanism: Type,
    authenticationProvider: provider
  }
})
```


### Options

```typescript
type AwsIamAuthenticatorOptions = {
  region: string; // AWS region of the MSK cluster
  ttl?: string; // X-Amz-Expires, for more information https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
  userAgent?: string; 
  credentials?: AwsCredentialIdentity | Provider<AwsCredentialIdentity> // default https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_credential_providers.html#fromnodeproviderchain
}
```

## Examples

For working examples look at the `examples` folder.

