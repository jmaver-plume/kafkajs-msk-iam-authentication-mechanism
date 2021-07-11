const { SignatureV4 } = require('@aws-sdk/signature-v4')
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { getDefaultRoleAssumerWithWebIdentity } = require('@aws-sdk/client-sts');
const crypto = require('crypto')

class Sha256HashConstructor {
  constructor() {
    this.sha256 = crypto.createHash('sha256');
  }

  update(data, inputEncoding) {
    this.sha256.update(data, inputEncoding);
  }

  digest (encoding) {
    return this.sha256.digest(encoding);
  }
}

class AuthenticationPayload {
  REGION = 'us-east-1'
  SERVICE = 'kafka-cluster'
  constructor () {
    this.provider = defaultProvider({
      roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity,
    });;

    this.signature = new SignatureV4({
      credentials: this.provider,
      region: this.REGION,
      service: this.SERVICE,
      applyChecksum: false,
      uriEscapePath: true,
      sha256: Sha256HashConstructor
    });
  }

  timestampYYYYmmDDFormat (date) {
    const d = new Date(date);
    return this.timestampYYYYmmDDTHHMMSSZFormat(d).substring(0, 8)
  }

  timestampYYYYmmDDTHHMMSSZFormat (date) {
    const d = new Date(date);
    return d.toISOString()
      .replace(/[-.:]/g,'')
      .substring(0, 15)
      .concat("Z")
  }

  // TESTED
  generateCredential (accessKeyId, date) {
    return `${accessKeyId}/${date}/${this.REGION}/${this.SERVICE}/aws4_request`
  }

  // TESTED
  async create (options) {
    const { brokerHost } = options;
    if (!brokerHost) {
      throw new Error ('Missing values');
    }

    const now = Date.now();
    const signature = await this.signature.sign('stringToSign', { signingDate: now })
    const { accessKeyId, sessionToken } = await this.provider();

    console.log('accessKeyId: ', accessKeyId);
    console.log('sessionToken: ', sessionToken);

    return {
      version: "2020_10_22",
      "user-agent": "test-api",
      host: brokerHost,
      action: "kafka-cluster:Connect",
      "x-amz-credential": this.generateCredential(accessKeyId, this.timestampYYYYmmDDFormat(now)),
      "x-amz-algorithm": "AWS4-HMAC-SHA256",
      "x-amz-date": this.timestampYYYYmmDDTHHMMSSZFormat(now),
      "x-amz-security-token": sessionToken,
      "x-amz-signedheaders": 'host',
      "x-amz-expires": "900",
      "x-amz-signature": signature,
    }
  }
}

module.exports = {AuthenticationPayload}