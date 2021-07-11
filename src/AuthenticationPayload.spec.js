const crypto = require('crypto');
const nock = require('nock');
const MockDate = require('mockdate');
const { AuthenticationPayload } = require('./AuthenticationPayload');

describe('AuthenticationPayload', () => {
  let instance;
  let timestamp;

  const brokerHost = 'example.com'
  const region = 'us-east-1'
  const accessKeyId = 'accesskeyid'
  const secretAccessKey = 'secretkey'

  beforeAll(() => {
    MockDate.set('2021-01-01');
    timestamp = new Date().toISOString().replace(/[-.:]/g,'')
      .substring(0, 15)
      .concat("Z");
    instance = new AuthenticationPayload({ brokerHost });
  })

  afterAll(() => {
    MockDate.reset();
  })

  describe('constructor', () => {
    it('should return error when missing options argument', () => {
      try {
        new AuthenticationPayload()
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });

    it('should return error when options argument missing brokerHost field', () => {
      try {
        new AuthenticationPayload({})
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });
  })

  describe('generateScope', () => {
    it('should return correct value', () => {
      expect(instance.generateScope(region)).toBe("us-east-1/kafka-cluster")
    })
  })

  describe('generatePayload', () => {
    it('should return correct value', () => {
      const payload =  instance.generatePayload({ secretAccessKey, accessKeyId, brokerHost, token: 'token'  })
      expect(payload).toHaveProperty("version", "2020_10_22")
      expect(payload).toHaveProperty("host", brokerHost)
      expect(payload).toHaveProperty("user-agent", "test-api")
      expect(payload).toHaveProperty("action", "kafka-cluster:Connect")
      expect(payload).toHaveProperty("x-amz-algorithm", "AWS4-HMAC-SHA256")
      expect(payload).toHaveProperty("x-amz-credential", `${accessKeyId}/20210101/${region}/kafka-cluster/aws4_request`)
      expect(payload).toHaveProperty("x-amz-date", timestamp)
      expect(payload).toHaveProperty("x-amz-security-token", "token")
      expect(payload).toHaveProperty("x-amz-signedheaders", "host")
      expect(payload).toHaveProperty("x-amz-expires", "900")
      expect(payload).toHaveProperty("x-amz-signature", "568ddcedca116fbd9684f8f48082f36fdb4b27bc3527788dd89dfb1e1c6b9ca2")
    });

    it('should throw error when missing secret access key', () => {
      try {
        instance.generatePayload({ accessKeyId })
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });
  });
});