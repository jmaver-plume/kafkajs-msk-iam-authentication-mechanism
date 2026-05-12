import type { SaslAuthenticationRequest } from "kafkajs";
import { INT32_SIZE } from "./constants";
import type { Payload } from "./create-payload";

/** @internal */
export const createSaslAuthenticationRequest = (
  payload: Payload
): SaslAuthenticationRequest => ({
  encode: () => {
    const stringifiedPayload = JSON.stringify(payload);
    const byteLength = Buffer.byteLength(stringifiedPayload, "utf8");
    const buf = Buffer.alloc(INT32_SIZE + byteLength);
    buf.writeUInt32BE(byteLength, 0);
    buf.write(stringifiedPayload, INT32_SIZE, byteLength, "utf8");
    return buf;
  },
});
