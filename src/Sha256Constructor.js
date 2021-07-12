const { createHmac } = require('crypto')

class Sha256HashConstructor {
  constructor (signingKey) {
    this.sha256 = createHmac('sha256', signingKey)
  }

  digest () {
    return Promise.resolve(this.sha256.digest())
  }

  update (toHash, encoding) {
    if (typeof toHash === 'string' && encoding !== undefined) {
      this.sha256.update(toHash, encoding)
      return
    }

    this.sha256.update(toHash)
  }
}

module.exports = { Sha256HashConstructor }
