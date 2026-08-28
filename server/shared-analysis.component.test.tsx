// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const queryHarness = vi.hoisted(() => ({
  state: { data: undefined as unknown, error: null as unknown, isLoading: false },
}));

vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    share: { get: { useQuery: () => queryHarness.state } },
    pipeline2: { analyze: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
  },
}));

vi.mock("streamdown", () => ({ Streamdown: ({ children }: { children: unknown }) => children }));

import SharedAnalysis from "../client/src/pages/SharedAnalysis";

afterEach(() => { cleanup(); });

beforeEach(() => { globalThis.React = React; });

describe("SharedAnalysis page", () => {
  it("renders a shared result", () => {
    queryHarness.state = { data: { imageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP", answer: "Shared answer.", confidence: 0.89, regions: [], mode: "Vision Query", query: "Inspect the scene." }, error: null, isLoading: false };
    render(<SharedAnalysis token="test-token" />);
    expect(screen.getByText("Shared evidence report")).toBeTruthy();
    expect(screen.getByText("Shared answer.")).toBeTruthy();
    expect(screen.getByText("89% confidence")).toBeTruthy();
  });

  it("renders an unavailable state for a missing share", () => {
    queryHarness.state = { data: undefined, error: new Error("Not found"), isLoading: false };
    render(<SharedAnalysis token="missing-token" />);
    expect(screen.getByText("This shared analysis is unavailable")).toBeTruthy();
  });
});
