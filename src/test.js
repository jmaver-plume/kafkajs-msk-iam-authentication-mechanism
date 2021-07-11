const { SignatureV4 } = require('@aws-sdk/signature-v4')
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { getDefaultRoleAssumerWithWebIdentity } = require('@aws-sdk/client-sts');
const crypto = require('crypto');

class Test {
  constructor () {
    this.provider = defaultProvider({
      roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity,
    });;

    this.signature = new SignatureV4({
      credentials: this.provider,
      region: 'us-east-1',
      service: 'kafka-cluster',
      applyChecksum: false,
      uriEscapePath: true,
      sha256: crypto.createHash
    });
  }

  test () {
    const signed = this.signature.sign('stringToSign', { signingDate: now })
    console.log('Signed: ', signed);
  }
}

const test = new Test()
console.log('execution: ', test.test())

