import { AuthenticationProviderArgs, Authenticator } from "kafkajs";
import {
  CreatePayload,
  createSaslAuthenticationRequest,
  createSaslAuthenticationResponse,
  TYPE,
  Options,
} from ".";

export const createAuthenticator =
  (options: Options) =>
  (args: AuthenticationProviderArgs): Authenticator => ({
    authenticate: async () => {
      const { host, port, logger, saslAuthenticate } = args;
      const broker = `${host}:${port}`;
      const payloadFactory = new CreatePayload(options);

      try {
        const payload = await payloadFactory.create({ brokerHost: host });
        const authenticateResponse = await saslAuthenticate({
          request: createSaslAuthenticationRequest(payload),
          response: createSaslAuthenticationResponse,
        });
        logger.info("Authentication response", { authenticateResponse });

        const isValidResponse =
          authenticateResponse &&
          typeof authenticateResponse === "object" &&
          "version" in authenticateResponse &&
          authenticateResponse.version;
        if (!isValidResponse) {
          throw new Error("Invalid response from broker");
        }

        logger.info(`SASL ${TYPE} authentication successful`, { broker });
      } catch (error) {
        if (error instanceof Error) {
          logger.error(error?.message, { broker });
        } else if (typeof error === "string") {
          logger.error(error, { broker });
        }
        throw error;
      }
    },
  });
