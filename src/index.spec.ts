import * as publicApi from ".";

describe("public API", () => {
  it("exports only createMechanism", () => {
    expect(Object.keys(publicApi).sort()).toEqual(["createMechanism"]);
  });
});
