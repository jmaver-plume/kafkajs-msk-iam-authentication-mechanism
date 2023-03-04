import MockDate from "mockdate";
import { CreatePayload } from ".";

describe("CreatePayload", () => {
  const region = "us-east-1";

  beforeAll(() => {
    MockDate.set("2021-01-01");
  });

  afterAll(() => {
    MockDate.reset();
  });

  describe("create", () => {
    it("should return correct authentication payload when credentials are an object", async () => {
      const credentials = {
        accessKeyId: "accessKeyId",
        sessionToken: "sessionToken",
        secretAccessKey: "secretAccessKey",
      };

      const authenticationPayloadCreator = new CreatePayload({
        region,
        credentials,
      });

      const brokerHost = "examples.com";
      const payload = await authenticationPayloadCreator.create({ brokerHost });

      expect(payload).toHaveProperty("version", "2020_10_22");
      expect(payload).toHaveProperty("host", brokerHost);
      expect(payload).toHaveProperty("user-agent", "MSK_IAM");
      expect(payload).toHaveProperty("action", "kafka-cluster:Connect");
      expect(payload).toHaveProperty("x-amz-algorithm", "AWS4-HMAC-SHA256");
      expect(payload).toHaveProperty(
        "x-amz-credential",
        `accessKeyId/20210101/${region}/kafka-cluster/aws4_request`
      );
      expect(payload).toHaveProperty("x-amz-date", "20210101T000000Z");
      expect(payload).toHaveProperty("x-amz-security-token", "sessionToken");
      expect(payload).toHaveProperty("x-amz-signedheaders", "host");
      expect(payload).toHaveProperty("x-amz-expires", "900");
      expect(payload).toHaveProperty(
        "x-amz-signature",
        "3515d158e62c159a3d8d4344942cff44c865cdeac6748a4b5dc42686641bb272"
      );
    });

    it("should return correct authentication payload when credentials are a method", async () => {
      const credentials = async () => ({
        accessKeyId: "accessKeyId",
        sessionToken: "sessionToken",
        secretAccessKey: "secretAccessKey",
      });

      const authenticationPayloadCreator = new CreatePayload({
        region,
        credentials,
      });

      const brokerHost = "examples.com";
      const payload = await authenticationPayloadCreator.create({ brokerHost });

      expect(payload).toHaveProperty("version", "2020_10_22");
      expect(payload).toHaveProperty("host", brokerHost);
      expect(payload).toHaveProperty("user-agent", "MSK_IAM");
      expect(payload).toHaveProperty("action", "kafka-cluster:Connect");
      expect(payload).toHaveProperty("x-amz-algorithm", "AWS4-HMAC-SHA256");
      expect(payload).toHaveProperty(
        "x-amz-credential",
        `accessKeyId/20210101/${region}/kafka-cluster/aws4_request`
      );
      expect(payload).toHaveProperty("x-amz-date", "20210101T000000Z");
      expect(payload).toHaveProperty("x-amz-security-token", "sessionToken");
      expect(payload).toHaveProperty("x-amz-signedheaders", "host");
      expect(payload).toHaveProperty("x-amz-expires", "900");
      expect(payload).toHaveProperty(
        "x-amz-signature",
        "3515d158e62c159a3d8d4344942cff44c865cdeac6748a4b5dc42686641bb272"
      );
    });
  });
});
