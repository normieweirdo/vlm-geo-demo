// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const routeState = vi.hoisted(() => ({
  data: { imageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP", answer: "Route-shared answer.", confidence: 0.9, regions: [], mode: "Vision Query" } as unknown,
  error: null as unknown,
}));

vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    pipeline2: { analyze: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    share: { get: { useQuery: () => ({ data: routeState.data, error: routeState.error, isLoading: false }) }, create: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) } },
  },
}));

vi.mock("streamdown", () => ({ Streamdown: ({ children }: { children: unknown }) => children }));

import App from "../client/src/App";

beforeEach(() => {
  globalThis.React = React;
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: false, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
});
afterEach(() => { cleanup(); window.history.pushState({}, "", "/"); });

describe("public share route", () => {
  it("renders the shared analysis route for a token", () => {
    window.history.pushState({}, "", "/share/route-token");
    routeState.error = null;
    render(<App />);
    expect(screen.getByText("Shared evidence report")).toBeTruthy();
    expect(screen.getByText("Route-shared answer.")).toBeTruthy();
  });

  it("renders the unavailable state for a missing token", () => {
    window.history.pushState({}, "", "/share/missing-token");
    routeState.data = undefined;
    routeState.error = new Error("Not found");
    render(<App />);
    expect(screen.getByText("This shared analysis is unavailable")).toBeTruthy();
  });
});
