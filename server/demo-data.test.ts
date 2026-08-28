import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseVlmResult } from "./routers";

const demoSchema = {
  answer: "string",
  confidence: "number",
  regions: "object",
};

function loadDemo(name: string) {
  const file = path.resolve(process.cwd(), "client/public/demos", name);
  return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
}

describe("VLM demo contracts", () => {
  it("parses structured model JSON and clamps region coordinates", () => {
    const result = parseVlmResult(JSON.stringify({
      answer: "A settlement is visible.",
      confidence: 0.81,
      regions: [{ label: "settlement", bbox: [-0.2, 0.1, 1.2, 0.8] }],
    }));
    expect(result.answer).toContain("settlement");
    expect(result.confidence).toBe(0.81);
    expect(result.regions?.[0]?.bbox).toEqual([0, 0.1, 1, 0.8]);
  });

  it("rejects non-JSON model output", () => {
    expect(() => parseVlmResult("not json")).toThrow(/unreadable result/);
  });

  it("keeps both Pipeline 6 payloads aligned to the shared result shape", () => {
    for (const file of ["change-detection.json", "sar-fusion.json"]) {
      const payload = loadDemo(file);
      expect(typeof payload.answer).toBe(demoSchema.answer);
      expect(typeof payload.confidence).toBe(demoSchema.confidence);
      expect(Array.isArray(payload.regions)).toBe(true);
      expect((payload.regions as Array<{ bbox: number[] }>).every((region) => region.bbox.length === 4 && region.bbox.every((value) => value >= 0 && value <= 1))).toBe(true);
    }
  });
});
