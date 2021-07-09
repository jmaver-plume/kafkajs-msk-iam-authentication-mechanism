const axios = require('axios');
const crypto = require('crypto');

class AuthenticationPayload {
  // TESTED
  constructor(options) {
    if (!options || typeof options !== "object") {
      throw new Error('Options need to be supplied to constructor');
    }

    const { brokerHost } = options;
    if (!brokerHost) {
      throw new Error('Missing option value brokerHost');
    }

    this.brokerHost = brokerHost;
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
  generateSignature (timestamp, awsRegion, stringToSign, secretAccessKey) {
    const dateKey = crypto.createHmac('sha256', `AWS4${secretAccessKey}`).update(this.timestampYYYYmmDDFormat(timestamp)).digest()
    const dateRegionKey = crypto.createHmac('sha256', dateKey).update(awsRegion).digest()
    const dateRegionServiceKey = crypto.createHmac('sha256', dateRegionKey).update("kafka-cluster").digest()
    const signingKey = crypto.createHmac('sha256', dateRegionServiceKey).update("aws4_request").digest()
    return crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex')
  }

  // TESTED
  generatePayload (options) {
    const { secretAccessKey, accessKeyId, token } = options;
    if (!secretAccessKey || !accessKeyId || !token) {
      throw new Error ('Missing values');
    }

    const hardcodedRegion = 'us-east-1'
    const timestamp = new Date().toISOString()
      .replace(/[-.:]/g,'')
      .substring(0, 15)
      .concat("Z")

    const signedHeaders = this.generateSignedHeaders(); // very simple
    const hashedPayload = this.generateHashedPayload(); // very simple
    const scope = this.generateScope(hardcodedRegion); // very simple
    const credential = this.generateCredential(accessKeyId, timestamp, scope);
    const canonicalHeaders = this.generateCanonicalHeaders(this.brokerHost); // very simple, TODO check if need port or just hostname
    const canonicalQueryString = this.generateCanonicalQueryString(timestamp, credential, token); // should be correct
    const canonicalRequest = this.generateCanonicalRequest(canonicalQueryString, canonicalHeaders, signedHeaders, hashedPayload); //
    const stringToSign = this.generateStringToSign(timestamp, scope, canonicalRequest); // done
    const signature = this.generateSignature(timestamp, hardcodedRegion, stringToSign, secretAccessKey); //

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

  static async generateAccessSecretKeys () {
    const { data: token } = await axios.put('http://169.254.169.254/latest/api/token', undefined, { headers: {
        "X-aws-ec2-metadata-token-ttl-seconds": 21600
      }})
    const { data } = await axios.get('http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2-msk', { headers: {
        "X-aws-ec2-metadata-token": token
      }});

    const { SecretAccessKey: secretAccessKey, AccessKeyId: accessKeyId, Token: sessionToken } = data
    return { secretAccessKey, accessKeyId, token: sessionToken }
  }
}

module.exports = {AuthenticationPayload}