import { getDefaultRoleAssumerWithWebIdentity } from '@aws-sdk/client-sts';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { type AwsCredentialIdentity, type Provider } from '@aws-sdk/types';
import { createHash } from 'crypto';

import { Sha256HashConstructor } from './Sha256Constructor';

const service = 'kafka-cluster';
const signedHeaders = 'host';
const hashedPayload =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const algorithm = 'AWS4-HMAC-SHA256';
const action = 'kafka-cluster:Connect';

export type AuthenticationPayloadCreatorOptions = {
  /** The AWS region of the Kafka broker. */
  region: string;

  /**
   * Provides the time period, in seconds, for which the generated presigned URL is valid.
   * Defaults to 900 seconds.
   */
  ttl?: string;

  /** A string that describes the client. */
  userAgent?: string;
};

export type AuthenticationPayload = ReturnType<
  AuthenticationPayloadCreator['create']
> extends Promise<infer T>
  ? T
  : never;

export class AuthenticationPayloadCreator {
  private readonly region: string;
  private readonly ttl: string;
  private readonly userAgent: string;
  private readonly provider: Provider<AwsCredentialIdentity>;
  private readonly signature: SignatureV4;

  constructor({ region, ttl, userAgent }: AuthenticationPayloadCreatorOptions) {
    this.region = region;
    this.ttl = ttl ?? '900';
    this.userAgent = userAgent ?? 'MSK_IAM_v1.0.0';
    this.provider = defaultProvider({
      roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity({
        region: process.env.AWS_REGION ?? region,
      }),
    });

    this.signature = new SignatureV4({
      credentials: this.provider,
      region: this.region,
      service,
      applyChecksum: false,
      uriEscapePath: true,
      sha256: Sha256HashConstructor,
    });
  }

  // TESTED
  async create({ brokerHost }: { brokerHost: string }) {
    if (!brokerHost) {
      throw new Error('Missing values');
    }

    const { accessKeyId, sessionToken } = await this.provider();

    const now = Date.now();

    const xAmzCredential = this.generateXAmzCredential(
      accessKeyId,
      this.timestampYYYYmmDDFormat(now),
    );
    const canonicalHeaders = this.generateCanonicalHeaders(brokerHost);
    const canonicalQueryString = this.generateCanonicalQueryString(
      this.timestampYYYYmmDDTHHMMSSZFormat(now),
      xAmzCredential,
      sessionToken,
    );
    const canonicalRequest = this.generateCanonicalRequest(
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      hashedPayload,
    ); //
    const stringToSign = this.generateStringToSign(now, canonicalRequest);

    const signature = await this.signature.sign(stringToSign, {
      signingDate: new Date(now).toISOString(),
    });

    return {
      version: '2020_10_22',
      'user-agent': this.userAgent,
      host: brokerHost,
      action,
      'x-amz-credential': xAmzCredential,
      'x-amz-algorithm': algorithm,
      'x-amz-date': this.timestampYYYYmmDDTHHMMSSZFormat(now),
      'x-amz-security-token': sessionToken,
      'x-amz-signedheaders': signedHeaders,
      'x-amz-expires': this.ttl,
      'x-amz-signature': signature,
    };
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private timestampYYYYmmDDFormat(date: number) {
    return this.timestampYYYYmmDDTHHMMSSZFormat(date).substring(0, 8);
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private timestampYYYYmmDDTHHMMSSZFormat(date: number) {
    const d = new Date(date);
    return d.toISOString().replace(/[-.:]/g, '').substring(0, 15).concat('Z');
  }

  private generateCanonicalHeaders(brokerHost: string) {
    return `host:${brokerHost}\n`;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private generateXAmzCredential(accessKeyId: string, dateString: string) {
    return `${accessKeyId}/${dateString}/${this.region}/${service}/aws4_request`;
  }

  private generateStringToSign(date: number, canonicalRequest: string) {
    return `${algorithm}
${this.timestampYYYYmmDDTHHMMSSZFormat(date)}
${this.timestampYYYYmmDDFormat(date)}/${this.region}/${service}/aws4_request
${createHash('sha256').update(canonicalRequest, 'utf8').digest('hex')}`;
  }

  private generateCanonicalQueryString(
    dateString: string,
    xAmzCredential: string,
    sessionToken: string | undefined,
  ) {
    let canonicalQueryString = '';
    canonicalQueryString += `${encodeURIComponent(
      'Action',
    )}=${encodeURIComponent(action)}&`;
    canonicalQueryString += `${encodeURIComponent(
      'X-Amz-Algorithm',
    )}=${encodeURIComponent(algorithm)}&`;
    canonicalQueryString += `${encodeURIComponent(
      'X-Amz-Credential',
    )}=${encodeURIComponent(xAmzCredential)}&`;
    canonicalQueryString += `${encodeURIComponent(
      'X-Amz-Date',
    )}=${encodeURIComponent(dateString)}&`;
    canonicalQueryString += `${encodeURIComponent(
      'X-Amz-Expires',
    )}=${encodeURIComponent(this.ttl)}&`;

    if (sessionToken)
      canonicalQueryString += `${encodeURIComponent(
        'X-Amz-Security-Token',
      )}=${encodeURIComponent(sessionToken)}&`;

    canonicalQueryString += `${encodeURIComponent(
      'X-Amz-SignedHeaders',
    )}=${encodeURIComponent(signedHeaders)}`;

    return canonicalQueryString;
  }

  private generateCanonicalRequest(
    canonicalQueryString: string,
    canonicalHeaders: string,
    signedHeaders: string,
    hashedPayload: string,
  ) {
    return (
      'GET\n' +
      '/\n' +
      canonicalQueryString +
      '\n' +
      canonicalHeaders +
      '\n' +
      signedHeaders +
      '\n' +
      hashedPayload
    );
  }
}
