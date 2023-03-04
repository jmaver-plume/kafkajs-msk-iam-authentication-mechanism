const MockDate = require('mockdate')
const { AuthenticationPayloadCreator } = require('./AuthenticationPayloadCreator')

describe('AuthenticationPayloadCreator', () => {
  const region = 'us-east-1'
  const credentials = async () => ({
    accessKeyId: 'accessKeyId',
    sessionToken: 'sessionToken',
    secretAccessKey: 'secretAccessKey'
  })
  const authenticationPayloadCreator = new AuthenticationPayloadCreator({ region, credentials })

  beforeAll(() => {
    MockDate.set('2021-01-01')
  })

  afterAll(() => {
    MockDate.reset()
  })

  describe('create', () => {
    let signatureProviderSpy

    beforeEach(() => {
      signatureProviderSpy = jest.spyOn(authenticationPayloadCreator.signature, 'credentialProvider').mockResolvedValue({
        accessKeyId: 'accessKeyId',
        sessionToken: 'sessionToken',
        secretAccessKey: 'secretAccessKey'
      })
    })

    it('should return correct authentication payload', async () => {
      const brokerHost = 'examples.com'
      const payload = await authenticationPayloadCreator.create({ brokerHost })

      expect(signatureProviderSpy).toHaveBeenCalled()

      expect(payload).toHaveProperty('version', '2020_10_22')
      expect(payload).toHaveProperty('host', brokerHost)
      expect(payload).toHaveProperty('user-agent', 'MSK_IAM')
      expect(payload).toHaveProperty('action', 'kafka-cluster:Connect')
      expect(payload).toHaveProperty('x-amz-algorithm', 'AWS4-HMAC-SHA256')
      expect(payload).toHaveProperty('x-amz-credential', `accessKeyId/20210101/${region}/kafka-cluster/aws4_request`)
      expect(payload).toHaveProperty('x-amz-date', '20210101T000000Z')
      expect(payload).toHaveProperty('x-amz-security-token', 'sessionToken')
      expect(payload).toHaveProperty('x-amz-signedheaders', 'host')
      expect(payload).toHaveProperty('x-amz-expires', '900')
      expect(payload).toHaveProperty('x-amz-signature', '3515d158e62c159a3d8d4344942cff44c865cdeac6748a4b5dc42686641bb272')
    })
  })
})
