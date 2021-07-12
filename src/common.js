const crypto = require('crypto');

class AuthenticationPayloadCreator {
  constructor(provider, signature, brokerHost) {
    this.brokerHost = brokerHost;
    this.signature = signature;
    this.provider = provider;
  }

  timestampYYYYmmDDFormat (timestampISOString) {
    return timestampISOString.substring(0, 8)
  }

  // TESTED
  generateSignedHeaders () {
    return "host"
  }

  // TESTED
  generateHashedPayload () {
    return crypto.createHash('sha256').update("").digest("hex")
  }

  // TESTED
  generateCanonicalHeaders () {
    return `host:${this.brokerHost}\n`
  }

  // TESTED
  generateScope (region) {
    return `${region}/kafka-cluster`
  }

  // TESTED
  generateStringToSign (timestamp, scope, canonicalRequest) {
    return `AWS4-HMAC-SHA256
${timestamp}
${this.timestampYYYYmmDDFormat(timestamp)}/${scope}/aws4_request
${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`
  }

  // TESTED
  generateCanonicalRequest (canonicalQueryString, canonicalHeaders, signedHeaders, hashedPayload) {
    return "GET\n"+
      "/\n"+
      canonicalQueryString+"\n"+
      canonicalHeaders+"\n"+
      signedHeaders+"\n"+
      hashedPayload
  };

  generateCredential (accessKeyId, timestamp, scope) {
    return `${accessKeyId}/${this.timestampYYYYmmDDFormat(timestamp)}/${scope}/aws4_request`
  }

  // TESTED
  generateCanonicalQueryString (timestamp, credential, token) {
    let canonicalQueryString = "";
    canonicalQueryString += `${encodeURIComponent("Action")}=${encodeURIComponent("kafka-cluster:Connect")}&`;
    canonicalQueryString += `${encodeURIComponent("X-Amz-Algorithm")}=${encodeURIComponent("AWS4-HMAC-SHA256")}&`;
    canonicalQueryString += `${encodeURIComponent("X-Amz-Credential")}=${encodeURIComponent(credential)}&`;
    canonicalQueryString += `${encodeURIComponent("X-Amz-Date")}=${encodeURIComponent(timestamp)}&`;
    canonicalQueryString += `${encodeURIComponent("X-Amz-Expires")}=${encodeURIComponent("900")}&`;
    canonicalQueryString += `${encodeURIComponent("X-Amz-Security-Token")}=${encodeURIComponent(token)}&`;
    canonicalQueryString += `${encodeURIComponent("X-Amz-SignedHeaders")}=${encodeURIComponent("host")}`;

    return canonicalQueryString
  }

  // TESTED
  async create () {
    const hardcodedRegion = 'us-east-1'
    const now = Date.now();
    const timestamp = new Date(now).toISOString()
      .replace(/[-.:]/g,'')
      .substring(0, 15)
      .concat("Z")

    const { secretAccessKey, accessKeyId, token } = await this.provider();
    const signedHeaders = this.generateSignedHeaders(); // very simple
    const hashedPayload = this.generateHashedPayload(); // very simple
    const scope = this.generateScope(hardcodedRegion); // very simple
    const credential = this.generateCredential(accessKeyId, timestamp, scope);
    const canonicalHeaders = this.generateCanonicalHeaders(this.brokerHost); // very simple, TODO check if need port or just hostname
    const canonicalQueryString = this.generateCanonicalQueryString(timestamp, credential, token); // should be correct
    const canonicalRequest = this.generateCanonicalRequest(canonicalQueryString, canonicalHeaders, signedHeaders, hashedPayload); //
    const stringToSign = this.generateStringToSign(timestamp, scope, canonicalRequest); // done
    const signature = await this.signature.sign(stringToSign, { signingDate: now });

    return {
      version: "2020_10_22",
      "user-agent": "test-api",
      host: this.brokerHost,
      action: "kafka-cluster:Connect",
      "x-amz-credential": credential,
      "x-amz-algorithm": "AWS4-HMAC-SHA256",
      "x-amz-date": timestamp,
      "x-amz-security-token": token,
      "x-amz-signedheaders": signedHeaders,
      "x-amz-expires": "900",
      "x-amz-signature": signature,
    }
  }
}

module.exports = { AuthenticationPayloadCreator }