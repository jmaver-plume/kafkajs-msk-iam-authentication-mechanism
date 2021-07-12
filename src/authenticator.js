"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AuthenticationPayloadCreator_1 = require("./AuthenticationPayloadCreator");
const Authenticator = ({ sasl, connection, logger, saslAuthenticate }) => {
    const INT32_SIZE = 4;
    const request = (payload) => ({
        encode: () => {
            const stringifiedPayload = JSON.stringify(payload);
            const byteLength = Buffer.byteLength(stringifiedPayload, 'utf8');
            const buf = Buffer.alloc(INT32_SIZE + byteLength);
            buf.writeUInt32BE(byteLength, 0);
            buf.write(stringifiedPayload, INT32_SIZE, byteLength, 'utf8');
            return buf;
        }
    });
    const response = {
        decode: (rawData) => {
            const byteLength = rawData.readInt32BE(0);
            return rawData.slice(INT32_SIZE, INT32_SIZE + byteLength);
        },
        parse: (data) => {
            return data.toString();
        },
    };
    return {
        authenticate: async () => {
            const { host, port } = connection;
            const broker = `${host}:${port}`;
            const payloadFactory = new AuthenticationPayloadCreator_1.AuthenticationPayloadCreator();
            try {
                logger.info(`Authenticate with ${sasl.mechanism}`, { broker });
                const payload = await payloadFactory.create({ brokerHost: host });
                console.log('Authenticate event #1', payload);
                const authenticateResponse = await saslAuthenticate({ request: request(payload), response });
                console.log('Authenticate event #2', authenticateResponse);
                // TODO: Response should equal payload or whatever?
                // if (authenticateResponse !== expectedResponse) {
                //   throw new Error("Mismatching response from broker")
                // }
                logger.info('SASL Simon authentication successful', { broker });
            }
            catch (e) {
                const error = new Error(`SASL ${sasl.mechanism} authentication failed: ${e.message}`);
                logger.error(error.message, { broker });
                throw error;
            }
        },
    };
};
module.exports = Authenticator;
