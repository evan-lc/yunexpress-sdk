import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { printJson, readDataInput } from "../../src/cli/output.ts";

describe("printJson", () => {
  it("outputs pretty-printed JSON to stdout", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const data = { waybill_number: "YT123", status: "delivered" };

    printJson(data);

    expect(spy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    spy.mockRestore();
  });
});

describe("readDataInput", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "yunexpress-cli-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("parses inline JSON string", async () => {
    const result = await readDataInput('{"productCode":"YTP01"}');
    expect(result).toEqual({ productCode: "YTP01" });
  });

  it("reads JSON from a file when prefixed with @", async () => {
    const filePath = join(tempDir, "payload.json");
    writeFileSync(filePath, '{"productCode":"YTP02"}');

    const result = await readDataInput(`@${filePath}`);
    expect(result).toEqual({ productCode: "YTP02" });
  });

  it("throws on invalid inline JSON", async () => {
    await expect(readDataInput("not-valid-json")).rejects.toThrow();
  });

  it("throws on missing file", async () => {
    await expect(readDataInput("@/nonexistent/file.json")).rejects.toThrow();
  });
});
