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
  createMechanism
} = require('@jm18457/kafkajs-msk-iam-authentication-mechanism')

const kafka = new Kafka({
  brokers: ['kafka1:9092', 'kafka2:9092'],
  clientId: 'my-app',
  ssl: true,
  sasl: createMechanism({ region: 'eu-central-1' })
})
```

You can also use the old way of importing the library.

```javascript
const { Kafka } = require('kafkajs')
const {
  Type,
  awsIamAuthenticator,
} = require('@jm18457/kafkajs-msk-iam-authentication-mechanism')


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

## Examples

For working examples look at the `examples` folder.

## API Reference

### References

#### TYPE

Renames and re-exports [Type](README.md#type-1)

___

#### createAuthenticator

Renames and re-exports [awsIamAuthenticator](README.md#awsiamauthenticator)

### Type Aliases

#### Options

Ƭ **Options**: `Object`

##### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `credentials?` | `AwsCredentialIdentity` \| `Provider`<`AwsCredentialIdentity`\> | **`Default`** fromNodeProviderChain() |
| `region` | `string` | The AWS region in which the Kafka broker exists. |
| `ttl?` | `string` | Provides the time period, in seconds, for which the generated presigned URL is valid. **`Default`** 900 |
| `userAgent?` | `string` | Is a string passed in by the client library to describe the client. **`Default`** MSK_IAM |

##### Defined in

[create-mechanism.ts:5](https://github.com/jmaver-plume/kafkajs-msk-iam-authentication-mechanism/blob/13b1c03/src/create-mechanism.ts#L5)

### Variables

#### Type

• `Const` **Type**: ``"AWS_MSK_IAM"``

##### Defined in

[constants.ts:3](https://github.com/jmaver-plume/kafkajs-msk-iam-authentication-mechanism/blob/13b1c03/src/constants.ts#L3)

### Functions

#### awsIamAuthenticator

▸ **awsIamAuthenticator**(`options`): (`args`: `AuthenticationProviderArgs`) => `Authenticator`

##### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`Options`](README.md#options) |

##### Returns

`fn`

▸ (`args`): `Authenticator`

###### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `AuthenticationProviderArgs` |

###### Returns

`Authenticator`

##### Defined in

[create-authenticator.ts:11](https://github.com/jmaver-plume/kafkajs-msk-iam-authentication-mechanism/blob/13b1c03/src/create-authenticator.ts#L11)

___

#### createMechanism

▸ **createMechanism**(`options`, `mechanism?`): `Mechanism`

##### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `options` | [`Options`](README.md#options) | `undefined` |
| `mechanism` | `string` | `TYPE` |

##### Returns

`Mechanism`

##### Defined in

[create-mechanism.ts:26](https://github.com/jmaver-plume/kafkajs-msk-iam-authentication-mechanism/blob/13b1c03/src/create-mechanism.ts#L26)


