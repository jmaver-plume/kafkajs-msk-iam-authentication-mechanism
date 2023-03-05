export * from "./constants";
export * from "./create-authenticator";
export * from "./create-mechanism";
export * from "./create-payload";
export * from "./create-sasl-authentication-request";
export * from "./create-sasl-authentication-response";
import { createAuthenticator } from "./create-authenticator";
import { TYPE } from "./constants";

export const Type = TYPE;
export const awsIamAuthenticator = createAuthenticator;
