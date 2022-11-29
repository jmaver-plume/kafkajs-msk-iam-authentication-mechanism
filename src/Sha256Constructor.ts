import { type SourceData } from '@aws-sdk/types';
import { type BinaryLike, type Encoding, type Hmac, createHmac } from 'crypto';

export class Sha256HashConstructor {
  private readonly sha256: Hmac;

  constructor(signingKey?: SourceData) {
    if (typeof signingKey !== 'string') {
      throw new Error('Signing key must be a string!');
    }

    this.sha256 = createHmac('sha256', signingKey);
  }

  async digest() {
    return Promise.resolve(this.sha256.digest());
  }

  update(toHash: BinaryLike): void;
  update(toHash: string, encoding: Encoding): void;
  update(toHash: BinaryLike | string, encoding?: Encoding) {
    if (typeof toHash === 'string' && encoding !== undefined) {
      this.sha256.update(toHash, encoding);
      return;
    }

    this.sha256.update(toHash);
  }
}
