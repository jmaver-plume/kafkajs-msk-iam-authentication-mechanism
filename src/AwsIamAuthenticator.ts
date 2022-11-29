import type { Mechanism, SaslAuthenticationResponse } from 'kafkajs';

import {
  type AuthenticationPayload,
  AuthenticationPayloadCreator,
} from './AuthenticationPayloadCreator';

export type AwsIamAuthenticatorOptions = {
  /** The AWS region of the Kafka broker. */
  region: string;

  /**
   * Provides the time period, in seconds, for which the generated presigned URL is valid.
   * Defaults to 900 seconds.
   */
  ttl?: string;
};

export const awsIamAuthenticator =
  ({
    region,
    ttl,
  }: AwsIamAuthenticatorOptions): Mechanism['authenticationProvider'] =>
  ({ host, port, logger, saslAuthenticate }) => {
    const int32Size = 4;

    const request = (payload: AuthenticationPayload) => ({
      encode() {
        const stringifiedPayload = JSON.stringify(payload);
        const byteLength = Buffer.byteLength(stringifiedPayload, 'utf8');
        const buf = Buffer.alloc(int32Size + byteLength);
        buf.writeUInt32BE(byteLength, 0);
        buf.write(stringifiedPayload, int32Size, byteLength, 'utf8');
        return buf;
      },
    });

    const response: SaslAuthenticationResponse<{ version?: string }> = {
      decode(rawData: Buffer) {
        const byteLength = rawData.readInt32BE(0);
        return rawData.slice(int32Size, int32Size + byteLength);
      },

      parse(data: Buffer) {
        return JSON.parse(data.toString()) as Record<string, unknown>;
      },
    };

    return {
      async authenticate() {
        const broker = `${host}:${port}`;
        const payloadFactory = new AuthenticationPayloadCreator({
          region,
          ttl,
        });

        try {
          const payload = await payloadFactory.create({ brokerHost: host });
          const authenticateResponse = await saslAuthenticate({
            request: request(payload),
            response,
          });
          logger.info('Authentication response', { authenticateResponse });

          if (!authenticateResponse?.version) {
            throw new Error('Invalid response from broker');
          }

          logger.info('SASL Simon authentication successful', { broker });
        } catch (error) {
          if (error instanceof Error) {
            logger.error(error.message, { broker });
          }

          throw error;
        }
      },
    };
  };
