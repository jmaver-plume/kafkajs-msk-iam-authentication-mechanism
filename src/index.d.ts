import type {
  Authenticator,
  AuthenticationProviderArgs,
} from "kafkajs/types/index";

export function awsIamAuthenticator(
  region: string,
  ttl?: string
): (args: AuthenticationProviderArgs) => Authenticator;

export const Type = "AWS_MSK_IAM";
