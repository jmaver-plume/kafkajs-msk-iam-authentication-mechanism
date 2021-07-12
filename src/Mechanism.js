const { AuthenticationPayloadCreator } = require('./AuthenticationPayloadCreator')

const Mechanism = ({ sasl, connection, logger, saslAuthenticate }) => {
  const INT32_SIZE = 4

  const request = (payload) => ({
    encode: () => {
      const stringifiedPayload = JSON.stringify(payload)
      const byteLength = Buffer.byteLength(stringifiedPayload, 'utf8')
      const buf = Buffer.alloc(INT32_SIZE + byteLength)
      buf.writeUInt32BE(byteLength, 0)
      buf.write(stringifiedPayload, INT32_SIZE, byteLength, 'utf8')
      return buf
    }
  })

  const response = {
    decode: (rawData) => {
      const byteLength = rawData.readInt32BE(0)
      return rawData.slice(INT32_SIZE, INT32_SIZE + byteLength)
    },

    parse: (data) => {
      return data.toString()
    }
  }

  return {
    authenticate: async () => {
      const { host, port } = connection
      const broker = `${host}:${port}`
      const payloadFactory = new AuthenticationPayloadCreator({ region: sasl.region })

      try {
        const payload = await payloadFactory.create({ brokerHost: host })
        const authenticateResponse = await saslAuthenticate({ request: request(payload), response })
        logger.info('Authentication response', { authenticateResponse })

        if (!authenticateResponse.version || !authenticateResponse['request-id']) {
          throw new Error('Invalid response from broker')
        }

        logger.info('SASL Simon authentication successful', { broker })
      } catch (error) {
        logger.error(error.message, { broker })
        throw error
      }
    }
  }
}

module.exports = { Mechanism }
