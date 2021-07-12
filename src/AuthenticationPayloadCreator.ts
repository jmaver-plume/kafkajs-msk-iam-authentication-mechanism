import { SignatureV4 } from '@aws-sdk/signature-v4'
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { getDefaultRoleAssumerWithWebIdentity } = require('@aws-sdk/client-sts');
import { createHash } from 'crypto'
import {Sha256HashConstructor} from "./Sha256Constructor";

export type AuthenticationPayload = {
    version: string;
    "user-agent": string,
    host: string,
    action: string,
    "x-amz-credential": string,
    "x-amz-algorithm": string,
    "x-amz-date": string,
    "x-amz-security-token": string,
    "x-amz-signedheaders": string,
    "x-amz-expires": string,
    "x-amz-signature": string,
}

const REGION = 'us-east-1'
const SERVICE = 'kafka-cluster'
const SIGNED_HEADERS = 'host'
const HASHED_PAYLOAD = 'change_later' // todo
const ALGORITHM = "AWS4-HMAC-SHA256"
const ACTION = "kafka-cluster:Connect"
const EXPIRES_IN = "900"
const VERSION = "2020_10_22"

export class AuthenticationPayloadCreator {
    private readonly provider: any
    private readonly signature: SignatureV4;

    constructor () {
        this.provider = defaultProvider({
            roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity,
        });

        this.signature = new SignatureV4({
            credentials: this.provider,
            region: REGION,
            service: SERVICE,
            applyChecksum: false,
            uriEscapePath: true,
            sha256: Sha256HashConstructor
        });
    }

    timestampYYYYmmDDFormat (date: string | number | Date): string {
        const d = new Date(date);
        return this.timestampYYYYmmDDTHHMMSSZFormat(d).substring(0, 8)
    }

    timestampYYYYmmDDTHHMMSSZFormat (date: string | number | Date): string {
        const d = new Date(date);
        return d.toISOString()
            .replace(/[-.:]/g,'')
            .substring(0, 15)
            .concat("Z")
    }

    // TESTED
    generateCanonicalHeaders (brokerHost: string): string {
        return `host:${brokerHost}\n`
    }

    // TESTED
    generateXAmzCredential (accessKeyId: string, dateString: string): string {
        return `${accessKeyId}/${dateString}/${REGION}/${SERVICE}/aws4_request`
    }

    generateStringToSign (date: number | string | Date, canonicalRequest: string): string {
        return `${ALGORITHM}
${this.timestampYYYYmmDDTHHMMSSZFormat(date)}
${this.timestampYYYYmmDDFormat(date)}/${REGION}/${SERVICE}/aws4_request
${createHash('sha256').update(canonicalRequest, 'utf8').digest('hex')}`
    }

    // TESTED
    generateCanonicalQueryString (dateString: string, xAmzCredential: string, sessionToken: string): string {
        let canonicalQueryString = "";
        canonicalQueryString += `${encodeURIComponent("Action")}=${encodeURIComponent(ACTION)}&`;
        canonicalQueryString += `${encodeURIComponent("X-Amz-Algorithm")}=${encodeURIComponent(ALGORITHM)}&`;
        canonicalQueryString += `${encodeURIComponent("X-Amz-Credential")}=${encodeURIComponent(xAmzCredential)}&`;
        canonicalQueryString += `${encodeURIComponent("X-Amz-Date")}=${encodeURIComponent(dateString)}&`;
        canonicalQueryString += `${encodeURIComponent("X-Amz-Expires")}=${encodeURIComponent(EXPIRES_IN)}&`;
        canonicalQueryString += `${encodeURIComponent("X-Amz-Security-Token")}=${encodeURIComponent(sessionToken)}&`;
        canonicalQueryString += `${encodeURIComponent("X-Amz-SignedHeaders")}=${encodeURIComponent(SIGNED_HEADERS)}`;

        return canonicalQueryString
    }

    // TESTED
    generateCanonicalRequest (canonicalQueryString: string, canonicalHeaders: string, signedHeaders: string, hashedPayload: string): string {
        return "GET\n"+
            "/\n"+
            canonicalQueryString+"\n"+
            canonicalHeaders+"\n"+
            signedHeaders+"\n"+
            hashedPayload
    };

    // TESTED
    async create (options: { brokerHost: string}): Promise<AuthenticationPayload> {
        const { brokerHost } = options;

        if (!brokerHost) {
            throw new Error ('Missing values');
        }

        const { accessKeyId, sessionToken } = await this.provider();

        const now = Date.now();

        const xAmzCredential = this.generateXAmzCredential(accessKeyId, this.timestampYYYYmmDDFormat(now))
        const canonicalHeaders = this.generateCanonicalHeaders(brokerHost);
        const canonicalQueryString = this.generateCanonicalQueryString(this.timestampYYYYmmDDTHHMMSSZFormat(now), xAmzCredential, sessionToken);
        const canonicalRequest = this.generateCanonicalRequest(canonicalQueryString, canonicalHeaders, SIGNED_HEADERS, HASHED_PAYLOAD); //
        const stringToSign = this.generateStringToSign(
            now,
            canonicalRequest
        );

        const signature = await this.signature.sign(stringToSign, { signingDate: now })

        return {
            version: VERSION,
            "user-agent": "test-api",
            host: brokerHost,
            action: ACTION,
            "x-amz-credential": xAmzCredential,
            "x-amz-algorithm": ALGORITHM,
            "x-amz-date": this.timestampYYYYmmDDTHHMMSSZFormat(now),
            "x-amz-security-token": sessionToken,
            "x-amz-signedheaders": SIGNED_HEADERS,
            "x-amz-expires": EXPIRES_IN,
            "x-amz-signature": signature,
        }
    }
}
