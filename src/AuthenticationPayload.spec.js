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

  describe('generateSignedHeaders', () => {
    it('should return correct response', () => {
      expect(instance.generateSignedHeaders()).toBe('host');
    });
  })

  describe('generateHashedPayload', () => {
    it('should return correct value', () => {
      expect(instance.generateHashedPayload()).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    });
  });

  describe('generateCanonicalHeaders', () => {
    it('should return correct value', () => {
      expect(instance.generateCanonicalHeaders()).toBe('host'+':'+brokerHost+'\n')
    });
  });

  describe('generateStringToSign', () => {
    it('should return correct value', () => {
      const canonicalRequest = instance.generateCanonicalHeaders();
      const scope = 'scope'
      expect(instance.generateStringToSign(timestamp, scope, canonicalRequest)).toBe("AWS4-HMAC-SHA256" + "\n" +
        '20210101T000000Z' + "\n" +
        "20210101/" + scope + "/aws4_request" + "\n" +
        "aa112d396f1b4d0bcf50ffc0fe552e9869d83899cf16413fe844881a8e431e3e"
      )
    });
  });


  describe('generateCanonicalRequest', () => {
    it('should return correct value', () => {
      const canonicalQueryString = 'canonicalQueryString';
      const canonicalHeaders = 'canonicalHeaders\n';
      const signedHeaders = 'signedHeaders';
      const hashedPayload = 'hashedPayload';
      expect(instance.generateCanonicalRequest(
        canonicalQueryString,
        canonicalHeaders,
        signedHeaders,
        hashedPayload
      )).toBe("GET\n"+
        "/\n"+
        canonicalQueryString+"\n"+
        canonicalHeaders+"\n"+
        signedHeaders+"\n"+
        hashedPayload);
    });
  });

  describe('generateCanonicalQueryString', () => {
    it('should return correct value', () => {
      const spy = jest.spyOn(global, 'encodeURIComponent');
      const scope = 'scope';
      const result = instance.generateCanonicalQueryString(timestamp, scope);
      expect(spy).toHaveBeenCalledTimes(12);
      expect(spy).toHaveBeenNthCalledWith(1, "Action")
      expect(spy).toHaveBeenNthCalledWith(2, "kafka-cluster:Connect")
      expect(spy).toHaveBeenNthCalledWith(3, "X-Amz-Algorithm")
      expect(spy).toHaveBeenNthCalledWith(4, "AWS4-HMAC-SHA256")
      expect(spy).toHaveBeenNthCalledWith(5, "X-Amz-Credential")
      expect(spy).toHaveBeenNthCalledWith(6, scope)
      expect(spy).toHaveBeenNthCalledWith(7, "X-Amz-Date")
      expect(spy).toHaveBeenNthCalledWith(8, timestamp)
      expect(spy).toHaveBeenNthCalledWith(9, "X-Amz-Expires")
      expect(spy).toHaveBeenNthCalledWith(10, "900")
      expect(spy).toHaveBeenNthCalledWith(11, "X-Amz-SignedHeaders")
      expect(spy).toHaveBeenNthCalledWith(12, "host")

      expect(result).toBe("Action=kafka-cluster%3AConnect&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=scope&X-Amz-Date=20210101T000000Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host")
    });
  });

  describe('generateScope', () => {
    it('should return correct value', () => {
      expect(instance.generateScope(region)).toBe("us-east-1/kafka-cluster")
    })
  })

  describe('generateSignature', () => {
    it('should return correct value', () => {
      const dateKey = Buffer.from('57b25cec2275e7a62acf9c952bcbab5ca662e19d768df4eb504934d13834c894', 'hex')
      const dateRegionKey = Buffer.from('50db6366f4f1d1b850a7d8c4ba2b300a30018e2db69b4a2ac614f4c8bcfccfde', 'hex')
      const dateRegionServiceKey = Buffer.from('51d76c7b58be19bc0dd8d52a7980efc3c3fd519bffa366499d697540234bda6c', 'hex')
      const signingKey = Buffer.from('43e0f68602a4bbb3fbb5dce6100f075dfc05f5cc03c72d0c5c97b7b4c40b3759', 'hex')

      const updateSpy1 = jest.fn().mockReturnValueOnce({ digest: jest.fn().mockReturnValueOnce(dateKey) });
      const updateSpy2 = jest.fn().mockReturnValueOnce({ digest: jest.fn().mockReturnValueOnce(dateRegionKey) });
      const updateSpy3 = jest.fn().mockReturnValueOnce({ digest: jest.fn().mockReturnValueOnce(dateRegionServiceKey) });
      const updateSpy4 = jest.fn().mockReturnValueOnce({ digest: jest.fn().mockReturnValueOnce(signingKey) });
      const updateSpy5 = jest.fn().mockReturnValueOnce({ digest: jest.fn().mockReturnValueOnce('TODO') });

      const spy = jest.spyOn(crypto, 'createHmac')
        .mockReturnValueOnce({ update: updateSpy1 })
        .mockReturnValueOnce({ update: updateSpy2 })
        .mockReturnValueOnce({ update: updateSpy3 })
        .mockReturnValueOnce({ update: updateSpy4 })
        .mockReturnValueOnce({ update: updateSpy5 })

      const stringToSign = 'string'
      instance.generateSignature(timestamp, region, stringToSign, secretAccessKey);
      expect(spy).toHaveBeenCalledTimes(5)
      expect(spy).toHaveBeenNthCalledWith(1, "sha256", "AWS4"+secretAccessKey)
      expect(spy).toHaveBeenNthCalledWith(2, "sha256", dateKey)
      expect(spy).toHaveBeenNthCalledWith(3, "sha256", dateRegionKey)
      expect(spy).toHaveBeenNthCalledWith(4, "sha256", dateRegionServiceKey)
      expect(spy).toHaveBeenNthCalledWith(5, "sha256", signingKey)

      expect(updateSpy1).toHaveBeenCalledWith("20210101")
      expect(updateSpy2).toHaveBeenCalledWith(region)
      expect(updateSpy3).toHaveBeenCalledWith('kafka-cluster')
      expect(updateSpy4).toHaveBeenCalledWith('aws4_request')
      expect(updateSpy5).toHaveBeenCalledWith(stringToSign)
    });
  });

  describe('generatePayload', () => {
    it('should return correct value', () => {
      const payload =  instance.generatePayload({ secretAccessKey, accessKeyId })
      expect(payload).toHaveProperty("version", "2020_10_22")
      expect(payload).toHaveProperty("host", brokerHost)
      expect(payload).toHaveProperty("user-agent", "test-api")
      expect(payload).toHaveProperty("action", "kafka-cluster:Connect")
      expect(payload).toHaveProperty("x-amz-algorithm", "AWS4-HMAC-SHA256")
      expect(payload).toHaveProperty("x-amz-credential", `${accessKeyId}/20210101/${region}/kafka-cluster/aws4_request`)
      expect(payload).toHaveProperty("x-amz-date", timestamp)
      // expect(payload).toHaveProperty("x-amz-security-token", "2020_10_22")
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

    it('should throw error when missing access key', () => {
      try {
        instance.generatePayload({ secretAccessKey })
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });
  });

  describe('generateAccessSecretKeys', () => {
    it('should return access key and secret token', async () => {
      const token = 'aaaaaBBBBBBBccccccXXXXXX'
      const accessKeyId = 'accessKeyId'
      const secretAccessKey = 'secretAccessKey'

      const tokenScope = nock('http://169.254.169.254', {
        reqheaders: {
          "X-aws-ec2-metadata-token-ttl-seconds": 21600
        }
      })
        .put('/latest/api/token', undefined)
        .reply(200, token)

      const credentialsScope = nock('http://169.254.169.254', {
        reqheaders: {
          "X-aws-ec2-metadata-token": token
        }
      })
        .get('/latest/meta-data/iam/security-credentials/ec2-msk')
        .reply(200, { SecretAccessKey: secretAccessKey, AccessKeyId: accessKeyId })

      const result = await AuthenticationPayload.generateAccessSecretKeys()
      expect(result).toHaveProperty('accessKeyId', accessKeyId)
      expect(result).toHaveProperty('secretAccessKey', secretAccessKey)

      expect(tokenScope.isDone()).toBe(true)
      expect(credentialsScope.isDone()).toBe(true)
    });
  });
});