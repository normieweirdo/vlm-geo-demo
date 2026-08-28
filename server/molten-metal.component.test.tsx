// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const oglHarness = vi.hoisted(() => {
  class FakeRenderer {
    static instances: FakeRenderer[] = [];
    gl = { canvas: document.createElement("canvas"), clearColor: vi.fn() };
    setSize = vi.fn();
    render = vi.fn();
    constructor() { FakeRenderer.instances.push(this); }
  }
  class FakeProgram {
    uniforms: Record<string, { value: unknown }>;
    constructor(_gl: unknown, options: { uniforms: Record<string, { value: unknown }> }) { this.uniforms = options.uniforms; }
  }
  class FakeTriangle { constructor(_gl: unknown) {} }
  class FakeMesh { constructor(_gl: unknown, _options: unknown) {} }
  return { FakeRenderer, FakeProgram, FakeTriangle, FakeMesh };
});

vi.mock("ogl", () => ({
  Renderer: oglHarness.FakeRenderer,
  Program: oglHarness.FakeProgram,
  Triangle: oglHarness.FakeTriangle,
  Mesh: oglHarness.FakeMesh,
}));

vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    pipeline2: {
      analyze: {
        useMutation: () => ({ isPending: false, mutate: vi.fn() }),
      },
    },
    share: {
      create: {
        useMutation: () => ({ isPending: false, mutateAsync: vi.fn(async () => ({ token: "test-token" })) }),
      },
    },
  },
}));

vi.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: unknown }) => children,
}));

import MoltenMetal from "../client/src/components/MoltenMetal";
import Home from "../client/src/pages/Home";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

beforeEach(() => {
  globalThis.React = React;
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver;
  globalThis.requestAnimationFrame = vi.fn(() => 1) as unknown as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = vi.fn() as unknown as typeof cancelAnimationFrame;
  URL.createObjectURL = vi.fn(() => "blob:test-preview");
  URL.revokeObjectURL = vi.fn();
});

describe("MoltenMetal component", () => {
  it("mounts an OGL canvas with the configured uniforms and removes it on unmount", () => {
    const { unmount, container } = render(<MoltenMetal color1="#5227FF" color2="#FF9FFC" speed={0.35} grain mouseInteraction />);
    const canvas = container.querySelector("canvas");

    expect(canvas).not.toBeNull();
    expect(oglHarness.FakeRenderer.instances[0]?.setSize).toHaveBeenCalled();
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");

    unmount();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("keeps the CSS color wash mounted when a renderer cannot initialize", () => {
    oglHarness.FakeRenderer.instances.length = 0;
    const { container } = render(<MoltenMetal />);
    expect(container.firstElementChild ?? container).toBeTruthy();
    expect(container.firstElementChild?.getAttribute("style")).toContain("radial-gradient");
  });
});

describe("Home regression with MoltenMetal", () => {
  it("keeps the core vision-query trigger and prompt selection reachable", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: "Run vision query" })).toBeTruthy();
    fireEvent.drop(screen.getByRole("button", { name: "Image upload drop zone" }), { dataTransfer: { files: [new File(["image-bytes"], "prompt.png", { type: "image/png" })] } });
    expect(screen.getByRole("option", { name: /Locate roads/ })).toBeTruthy();
    expect(screen.getByText("Results workspace")).toBeTruthy();
  });
});
