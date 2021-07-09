const { AuthenticationPayload } = require('./AuthenticationPayload');

const Authenticator = ({ sasl, connection, logger, saslAuthenticate }) => {
  const INT32_SIZE = 4

  const request = (payload) => ({
    /**
     * Encodes the value for `auth_bytes` in SaslAuthenticate request
     * @see https://kafka.apache.org/protocol.html#The_Messages_SaslAuthenticate
     *
     * In this example, we are just sending `sasl.says` as a string,
     * with the length of the string in bytes prepended as an int32
     **/
    encode: () => {
      const byteLength = Buffer.byteLength(payload, 'utf8')
      const buf = Buffer.alloc(INT32_SIZE + byteLength)
      buf.writeUInt32BE(byteLength, 0)
      buf.write(payload, INT32_SIZE, byteLength, 'utf8')
      return buf

      // const byteLength = Buffer.byteLength(sasl.says, 'utf8')
      // buf.write(sasl.says, INT32_SIZE, byteLength, 'utf8')
    }
  })

  const response = {
    /**
     * Decodes the `auth_bytes` in SaslAuthenticate response
     * @see https://kafka.apache.org/protocol.html#The_Messages_SaslAuthenticate
     *
     * This is essentially the reverse of `request.encode`, where
     * we read the length of the string as an int32 and then read
     * that many bytes
     */
    decode: rawData => {
      const byteLength = rawData.readInt32BE(0)
      return rawData.slice(INT32_SIZE, INT32_SIZE + byteLength)
    },

    /**
     * The return value from `response.decode` is passed into
     * this function, which is responsible for interpreting
     * the data. In this case, we just turn the buffer back
     * into a string
     */
    parse: data => {
      return data.toString()
    },
  }

  return {
    /**
     * This function is responsible for orchestrating the authentication flow.
     * Essentially we will send a SaslAuthenticate request with the
     * value of `sasl.says` to the broker, and expect to
     * get the same value back.
     *
     * Other authentication methods may do any other operations they
     * like, but communication with the brokers goes through
     * the SaslAuthenticate request.
     */
    authenticate: async () => {
      const { host, port } = connection
      const broker = `${host}:${port}`
      const awsMskIam = new AuthenticationPayload({ brokerHost: host })

      try {
        logger.info(`Authenticate with ${sasl.mechanism}`, { broker })
        const keys = await AuthenticationPayload.generateAccessSecretKeys();
        const payload = await awsMskIam.generatePayload(keys);
        console.log('Authenticate event #1', payload)
        const authenticateResponse = await saslAuthenticate({ request: request(JSON.stringify(payload)), response });
        console.log('Authenticate event #2', authenticateResponse)

        // TODO: Response should equal payload or whatever?
        // if (authenticateResponse !== expectedResponse) {
        //   throw new Error("Mismatching response from broker")
        // }

        logger.info('SASL Simon authentication successful', { broker })
      } catch (e) {
        const error = new Error(
          `SASL ${sasl.mechanism} authentication failed: ${e.message}`
        )
        logger.error(error.message, { broker })
        throw error
      }
    },
  }
}

module.exports = Authenticator