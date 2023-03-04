import type {
  Authenticator,
  AuthenticationProviderArgs,
} from "kafkajs";
import {AwsCredentialIdentity, Provider} from "@aws-sdk/types";

type AwsIamAuthenticatorOptions = {
  region: string;
  ttl?: string;
  userAgent?: string;
  credentials?: AwsCredentialIdentity | Provider<AwsCredentialIdentity>
}

export function awsIamAuthenticator(options: AwsIamAuthenticatorOptions): (args: AuthenticationProviderArgs) => Authenticator;

export const Type = "AWS_MSK_IAM";
