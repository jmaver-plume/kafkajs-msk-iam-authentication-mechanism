const { AuthenticationPayloadCreator } = require('./AuthenticationPayloadCreator')
const sinon = require('sinon')

describe('AuthenticationPayloadCreator', () => {
  describe('create', () => {
    it('should work', async () => {
      const instance = new AuthenticationPayloadCreator({ region: 'us-east-1' })
      sinon.stub(instance, 'provider').resolves({ accessKeyId: 'accessKeyId', sessionToken: 'sessionToken', secretAccessKey: 'secretAccessKey' })
      const result = await instance.create({ brokerHost: 'test' })
      expect(result).toBe(1)
      // expect()
    })
  })
})
