const { computeImageHash, matchImageByHash } = require("../utils/ai");

describe("AI utility helpers", () => {
  it("computes a SHA-256 hash for a buffer", () => {
    const buffer = Buffer.from("test image data", "utf-8");
    const hash = computeImageHash(buffer);

    expect(typeof hash).toBe("string");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("matches identical image buffers by hash", () => {
    const bufferA = Buffer.from("same image data", "utf-8");
    const bufferB = Buffer.from("same image data", "utf-8");
    const storedHash = computeImageHash(bufferA);

    expect(matchImageByHash(storedHash, bufferB)).toBe(true);
  });

  it("rejects different image buffers", () => {
    const bufferA = Buffer.from("image one", "utf-8");
    const bufferB = Buffer.from("image two", "utf-8");
    const storedHash = computeImageHash(bufferA);

    expect(matchImageByHash(storedHash, bufferB)).toBe(false);
  });
});
