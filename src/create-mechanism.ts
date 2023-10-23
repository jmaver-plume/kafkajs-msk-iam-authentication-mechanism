import { Mechanism } from "kafkajs";
import { AwsCredentialIdentity, Provider } from "@aws-sdk/types";
import { TYPE, createAuthenticator } from ".";

export type Options = {
  /**
   * The AWS region in which the Kafka broker exists.
   */
  region: string;
  /**
   * Provides the time period, in seconds, for which the generated presigned URL is valid.
   * @default 900
   */
  ttl?: string;
  /**
   * Is a string passed in by the client library to describe the client.
   * @default MSK_IAM
   */
  userAgent?: string;
  /**
   * @default fromNodeProviderChain()
   */
  credentials?: AwsCredentialIdentity | Provider<AwsCredentialIdentity>;
};

export const createMechanism = (
  options: Options,
  mechanism: string = TYPE
): Mechanism => ({
  mechanism,
  authenticationProvider: createAuthenticator(options),
});

export const executeCredentialsProvider = async (
  executeOptions: Options,
): Promise<Options> => {
  let options:Options  = {...executeOptions};
  options.credentials = typeof executeOptions.credentials === "function"
    ? await executeOptions.credentials() : executeOptions.credentials;
    return options;
};