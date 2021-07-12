import MockDate from 'mockdate'
import { AuthenticationPayloadCreator } from './AuthenticationPayloadCreator';
import * as credentialProvider from "@aws-sdk/credential-provider-node";

describe('AuthenticationPayload', () => {
    let instance;
    let mock;
    const region = 'us-east-1'

    beforeAll(() => {
        MockDate.set('2021-01-01');
        instance = new AuthenticationPayloadCreator({ region });
        mock = jest.spyOn(credentialProvider, 'defaultProvider').mockReturnValueOnce(() => {
            return Promise.resolve({
              accessKeyId: 'accessKeyId',
              secretAccessKey: 'secretAccessKey',
              sessionToken: 'sessionToken',
            })
        })
    })

    afterAll(() => {
        MockDate.reset();
    })

    describe('create', () => {
        const brokerHost = 'example.com'

        it('should return correct value', async () => {
            const payload =  await instance.create({ brokerHost })
            expect(mock).toBeCalled();
            expect(payload).toHaveProperty("version", "2020_10_22")
            expect(payload).toHaveProperty("host", brokerHost)
            expect(payload).toHaveProperty("user-agent", "test-api")
            expect(payload).toHaveProperty("action", "kafka-cluster:Connect")
            expect(payload).toHaveProperty("x-amz-algorithm", "AWS4-HMAC-SHA256")
            expect(payload).toHaveProperty("x-amz-credential", `accessKeyId/20210101/${region}/kafka-cluster/aws4_request`)
            expect(payload).toHaveProperty("x-amz-date", '20210101T000000Z')
            expect(payload).toHaveProperty("x-amz-security-token", "token")
            expect(payload).toHaveProperty("x-amz-signedheaders", "host")
            expect(payload).toHaveProperty("x-amz-expires", "900")
            expect(payload).toHaveProperty("x-amz-signature", "568ddcedca116fbd9684f8f48082f36fdb4b27bc3527788dd89dfb1e1c6b9ca2")
        });
    });
});