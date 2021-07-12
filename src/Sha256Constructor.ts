import {Hash, HashConstructor, SourceData} from "@aws-sdk/types";
import {createHash, Hash as NodeHash} from "crypto";

export const Sha256HashConstructor: HashConstructor = class MyHash implements Hash {
    private readonly sha256: NodeHash;
    constructor() {
        this.sha256 = createHash('sha256');
    }

    digest(): Promise<Uint8Array> {
        return Promise.resolve(this.sha256.digest());
    }

    update(toHash: SourceData, encoding?: "utf8" | "ascii" | "latin1"): void {
        if (typeof toHash === 'string' && encoding !== undefined) {
            this.sha256.update(toHash, encoding)
            return;
        }

        this.sha256.update(toHash as any);
    }
}