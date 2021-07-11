const { SignatureV4, ALGO } = require('@aws-sdk/signature-v4')

class AuthenticationPayload {
  timestampYYYYmmDDFormat (timestampISOString) {
    return timestampISOString.substring(0, 8)
  }

  // TESTED
  generateScope (region) {
    return `${region}/kafka-cluster`
  }

  // TESTED
  generateCredential (accessKeyId, timestamp, scope) {
    return `${accessKeyId}/${this.timestampYYYYmmDDFormat(timestamp)}/${scope}/aws4_request`
  }

  // TESTED
  generatePayload (options) {
    const { secretAccessKey, accessKeyId, token, brokerHost } = options;
    if (!secretAccessKey || !accessKeyId || !token || !brokerHost) {
      throw new Error ('Missing values');
    }

    const hardcodedRegion = 'us-east-1'
    const timestamp = new Date().toISOString()
      .replace(/[-.:]/g,'')
      .substring(0, 15)
      .concat("Z")

    const scope = this.generateScope(hardcodedRegion);
    const credential = this.generateCredential(accessKeyId, timestamp, scope);

    return {
      version: "2020_10_22",
      "user-agent": "test-api",
      host: this.brokerHost,
      action: "kafka-cluster:Connect",
      "x-amz-credential": credential,
      "x-amz-algorithm": "AWS4-HMAC-SHA256",
      "x-amz-date": timestamp,
      "x-amz-security-token": token,
      "x-amz-signedheaders": 'host',
      "x-amz-expires": "900",
      "x-amz-signature": signature,
    }
  }
}

module.exports = {AuthenticationPayload}