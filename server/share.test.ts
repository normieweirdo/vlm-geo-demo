import { describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ token: "", payload: "" }));

vi.mock("./db", () => ({
  createSharedAnalysis: vi.fn(async (share: { token: string; payload: string }) => {
    store.token = share.token;
    store.payload = share.payload;
    return share;
  }),
  getSharedAnalysisByToken: vi.fn(async (token: string) => token === store.token ? { id: 1, token, payload: store.payload, createdAt: new Date() } : undefined),
}));

import { appRouter } from "./routers";

describe("share procedures", () => {
  const payload = {
    imageUrl: "data:image/png;base64,example",
    answer: "A shareable answer.",
    confidence: 0.91,
    regions: [{ label: "Settlement core", bbox: [0.1, 0.2, 0.4, 0.5] as [number, number, number, number] }],
    mode: "Vision Query",
    query: "Identify the settlement core.",
  };

  it("creates and retrieves a tokenized analysis", async () => {
    const caller = appRouter.createCaller({ user: undefined, req: {} as never, res: {} as never });
    const created = await caller.share.create(payload);
    expect(created.token).toHaveLength(21);
    const retrieved = await caller.share.get({ token: created.token });
    expect(retrieved.answer).toBe(payload.answer);
    expect(retrieved.regions?.[0]?.label).toBe("Settlement core");
  });

  it("returns not found for an unknown token", async () => {
    const caller = appRouter.createCaller({ user: undefined, req: {} as never, res: {} as never });
    await expect(caller.share.get({ token: "unknown-share-token" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
