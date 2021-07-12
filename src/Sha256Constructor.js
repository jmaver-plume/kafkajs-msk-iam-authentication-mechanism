const { createHash } = require("crypto");

const Sha256HashConstructor = class {
    sha256
    constructor() {
        this.sha256 = createHash('sha256');
    }

    digest() {
        return Promise.resolve(this.sha256.digest());
    }

    update(toHash, encoding) {
        if (typeof toHash === 'string' && encoding !== undefined) {
            this.sha256.update(toHash, encoding)
            return;
        }

        this.sha256.update(toHash);
    }
}

module.exports = { Sha256HashConstructor }