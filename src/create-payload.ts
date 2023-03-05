import { AwsCredentialIdentity, Provider } from "@aws-sdk/types";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { createHash } from "crypto";
import { Sha256 } from "@aws-crypto/sha256-js";
import {
  ACTION,
  ALGORITHM,
  HASHED_PAYLOAD,
  SERVICE,
  SIGNED_HEADERS,
  Options,
} from ".";

/** @internal */
export type DateLike = number | Date | string;

/** @internal */
export type Payload = {
  version: string;
  "user-agent": string;
  host: string;
  action: string;
  "x-amz-credential": string;
  "x-amz-algorithm": string;
  "x-amz-date": string;
  "x-amz-security-token"?: string;
  "x-amz-signedheaders": string;
  "x-amz-expires": string;
  "x-amz-signature": string;
};

/** @internal */
export class CreatePayload {
  private readonly region: string;
  private readonly ttl: string;
  private readonly userAgent: string;
  private readonly credentials:
    | AwsCredentialIdentity
    | Provider<AwsCredentialIdentity>;
  private readonly signature: SignatureV4;

  constructor(options: Options) {
    const { region, ttl, userAgent, credentials } = options;
    this.region = region;
    this.ttl = ttl ?? "900";
    this.userAgent = userAgent ?? "MSK_IAM";
    this.credentials = credentials ?? fromNodeProviderChain();

    this.signature = new SignatureV4({
      credentials: this.credentials,
      region: this.region,
      service: SERVICE,
      applyChecksum: false,
      uriEscapePath: true,
      sha256: Sha256,
    });
  }

  timestampYYYYmmDDFormat(date: DateLike): string {
    const d = new Date(date);
    return this.timestampYYYYmmDDTHHMMSSZFormat(d).substring(0, 8);
  }

  timestampYYYYmmDDTHHMMSSZFormat(date: DateLike): string {
    const d = new Date(date);
    return d.toISOString().replace(/[-.:]/g, "").substring(0, 15).concat("Z");
  }

  generateCanonicalHeaders(brokerHost: string): string {
    return `host:${brokerHost}\n`;
  }

  generateXAmzCredential(accessKeyId: string, date: string): string {
    return `${accessKeyId}/${date}/${this.region}/${SERVICE}/aws4_request`;
  }

  generateStringToSign(date: DateLike, canonicalRequest: string): string {
    return `${ALGORITHM}
${this.timestampYYYYmmDDTHHMMSSZFormat(date)}
${this.timestampYYYYmmDDFormat(date)}/${this.region}/${SERVICE}/aws4_request
${createHash("sha256").update(canonicalRequest, "utf8").digest("hex")}`;
  }

  generateCanonicalQueryString(
    date: string,
    xAmzCredential: string,
    sessionToken?: string
  ): string {
    let canonicalQueryString = "";
    canonicalQueryString += `${encodeURIComponent(
      "Action"
    )}=${encodeURIComponent(ACTION)}&`;
    canonicalQueryString += `${encodeURIComponent(
      "X-Amz-Algorithm"
    )}=${encodeURIComponent(ALGORITHM)}&`;
    canonicalQueryString += `${encodeURIComponent(
      "X-Amz-Credential"
    )}=${encodeURIComponent(xAmzCredential)}&`;
    canonicalQueryString += `${encodeURIComponent(
      "X-Amz-Date"
    )}=${encodeURIComponent(date)}&`;
    canonicalQueryString += `${encodeURIComponent(
      "X-Amz-Expires"
    )}=${encodeURIComponent(this.ttl)}&`;

    if (sessionToken !== undefined) {
      canonicalQueryString += `${encodeURIComponent(
        "X-Amz-Security-Token"
      )}=${encodeURIComponent(sessionToken)}&`;
    }

    canonicalQueryString += `${encodeURIComponent(
      "X-Amz-SignedHeaders"
    )}=${encodeURIComponent(SIGNED_HEADERS)}`;

    return canonicalQueryString;
  }

  generateCanonicalRequest(
    canonicalQueryString: string,
    canonicalHeaders: string,
    signedHeaders: string,
    hashedPayload: string
  ): string {
    return (
      "GET\n" +
      "/\n" +
      canonicalQueryString +
      "\n" +
      canonicalHeaders +
      "\n" +
      signedHeaders +
      "\n" +
      hashedPayload
    );
  }

  async create({ brokerHost }: { brokerHost: string }): Promise<Payload> {
    if (!brokerHost) {
      throw new Error("Missing values");
    }
    const { accessKeyId, sessionToken } =
      typeof this.credentials === "function"
        ? await this.credentials()
        : this.credentials;
    const now = Date.now();
    const xAmzCredential = this.generateXAmzCredential(
      accessKeyId,
      this.timestampYYYYmmDDFormat(now)
    );
    const canonicalHeaders = this.generateCanonicalHeaders(brokerHost);
    const canonicalQueryString = this.generateCanonicalQueryString(
      this.timestampYYYYmmDDTHHMMSSZFormat(now),
      xAmzCredential,
      sessionToken
    );
    const canonicalRequest = this.generateCanonicalRequest(
      canonicalQueryString,
      canonicalHeaders,
      SIGNED_HEADERS,
      HASHED_PAYLOAD
    ); //
    const stringToSign = this.generateStringToSign(now, canonicalRequest);

    const signature = await this.signature.sign(stringToSign, {
      signingDate: new Date(now).toISOString(),
    });

    return {
      version: "2020_10_22",
      "user-agent": this.userAgent,
      host: brokerHost,
      action: ACTION,
      "x-amz-credential": xAmzCredential,
      "x-amz-algorithm": ALGORITHM,
      "x-amz-date": this.timestampYYYYmmDDTHHMMSSZFormat(now),
      "x-amz-security-token": sessionToken,
      "x-amz-signedheaders": SIGNED_HEADERS,
      "x-amz-expires": this.ttl,
      "x-amz-signature": signature,
    };
  }
}
