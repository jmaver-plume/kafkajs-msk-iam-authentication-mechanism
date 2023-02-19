const { SignatureV4 } = require('@aws-sdk/signature-v4')
const { defaultProvider } = require('@aws-sdk/credential-provider-node')
const { getDefaultRoleAssumerWithWebIdentity } = require('@aws-sdk/client-sts')
const { createHash } = require('crypto')
const { Sha256HashConstructor } = require('./Sha256Constructor')

const SERVICE = 'kafka-cluster'
const SIGNED_HEADERS = 'host'
const HASHED_PAYLOAD = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
const ALGORITHM = 'AWS4-HMAC-SHA256'
const ACTION = 'kafka-cluster:Connect'

class AuthenticationPayloadCreator {
  constructor ({ region, ttl, userAgent }) {
    this.region = region
    this.ttl = ttl || '900'
    this.userAgent = userAgent || 'MSK_IAM'
    this.provider = defaultProvider({
      roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity({
        region: process.env.AWS_REGION ?? region
      })
    })

    this.signature = new SignatureV4({
      credentials: this.provider,
      region: this.region,
      service: SERVICE,
      applyChecksum: false,
      uriEscapePath: true,
      sha256: Sha256HashConstructor
    })
  }

  timestampYYYYmmDDFormat (date) {
    const d = new Date(date)
    return this.timestampYYYYmmDDTHHMMSSZFormat(d).substring(0, 8)
  }

  timestampYYYYmmDDTHHMMSSZFormat (date) {
    const d = new Date(date)
    return d.toISOString()
      .replace(/[-.:]/g, '')
      .substring(0, 15)
      .concat('Z')
  }

  generateCanonicalHeaders (brokerHost) {
    return `host:${brokerHost}\n`
  }

  generateXAmzCredential (accessKeyId, dateString) {
    return `${accessKeyId}/${dateString}/${this.region}/${SERVICE}/aws4_request`
  }

  generateStringToSign (date, canonicalRequest) {
    return `${ALGORITHM}
${this.timestampYYYYmmDDTHHMMSSZFormat(date)}
${this.timestampYYYYmmDDFormat(date)}/${this.region}/${SERVICE}/aws4_request
${createHash('sha256').update(canonicalRequest, 'utf8').digest('hex')}`
  }

  generateCanonicalQueryString (dateString, xAmzCredential, sessionToken) {
    let canonicalQueryString = ''
    canonicalQueryString += `${encodeURIComponent('Action')}=${encodeURIComponent(ACTION)}&`
    canonicalQueryString += `${encodeURIComponent('X-Amz-Algorithm')}=${encodeURIComponent(ALGORITHM)}&`
    canonicalQueryString += `${encodeURIComponent('X-Amz-Credential')}=${encodeURIComponent(xAmzCredential)}&`
    canonicalQueryString += `${encodeURIComponent('X-Amz-Date')}=${encodeURIComponent(dateString)}&`
    canonicalQueryString += `${encodeURIComponent('X-Amz-Expires')}=${encodeURIComponent(this.ttl)}&`

    if (sessionToken) { canonicalQueryString += `${encodeURIComponent('X-Amz-Security-Token')}=${encodeURIComponent(sessionToken)}&` }

    canonicalQueryString += `${encodeURIComponent('X-Amz-SignedHeaders')}=${encodeURIComponent(SIGNED_HEADERS)}`

    return canonicalQueryString
  }

  generateCanonicalRequest (canonicalQueryString, canonicalHeaders, signedHeaders, hashedPayload) {
    return 'GET\n' +
          '/\n' +
          canonicalQueryString + '\n' +
          canonicalHeaders + '\n' +
          signedHeaders + '\n' +
          hashedPayload
  };

  // TESTED
  async create ({ brokerHost }) {
    if (!brokerHost) {
      throw new Error('Missing values')
    }

    const { accessKeyId, sessionToken } = await this.provider()

    const now = Date.now()

    const xAmzCredential = this.generateXAmzCredential(accessKeyId, this.timestampYYYYmmDDFormat(now))
    const canonicalHeaders = this.generateCanonicalHeaders(brokerHost)
    const canonicalQueryString = this.generateCanonicalQueryString(this.timestampYYYYmmDDTHHMMSSZFormat(now), xAmzCredential, sessionToken)
    const canonicalRequest = this.generateCanonicalRequest(canonicalQueryString, canonicalHeaders, SIGNED_HEADERS, HASHED_PAYLOAD) //
    const stringToSign = this.generateStringToSign(
      now,
      canonicalRequest
    )

    const signature = await this.signature.sign(stringToSign, {
      signingDate: new Date(now).toISOString()
    })

    return {
      version: '2020_10_22',
      'user-agent': this.userAgent,
      host: brokerHost,
      action: ACTION,
      'x-amz-credential': xAmzCredential,
      'x-amz-algorithm': ALGORITHM,
      'x-amz-date': this.timestampYYYYmmDDTHHMMSSZFormat(now),
      'x-amz-security-token': sessionToken,
      'x-amz-signedheaders': SIGNED_HEADERS,
      'x-amz-expires': this.ttl,
      'x-amz-signature': signature
    }
  }
}

module.exports = { AuthenticationPayloadCreator }
