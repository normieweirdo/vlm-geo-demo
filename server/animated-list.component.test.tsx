// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnimatedList from "../client/src/components/AnimatedList";

const mutationHarness = vi.hoisted(() => ({ isPending: false, mutate: vi.fn() }));
const pdfHarness = vi.hoisted(() => ({ save: vi.fn() }));

vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    pipeline2: {
      analyze: {
        useMutation: () => mutationHarness,
      },
    },
    share: {
      create: {
        useMutation: () => ({ isPending: false, mutateAsync: vi.fn(async () => ({ token: "test-token" })) }),
      },
    },
  },
}));

vi.mock("jspdf", () => ({
  jsPDF: class {
    setFillColor() {}
    rect() {}
    setTextColor() {}
    setFontSize() {}
    text() {}
    splitTextToSize(value: string) { return [value]; }
    save(name: string) { pdfHarness.save(name); }
  },
}));

vi.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: unknown }) => children,
}));

import Home, { OverlayImage } from "../client/src/pages/Home";

afterEach(() => { mutationHarness.isPending = false; vi.useRealTimers(); cleanup(); vi.restoreAllMocks(); });

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  globalThis.React = React;
  class ResizeObserverStub {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
  globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => { callback(0); return 0; }) as typeof requestAnimationFrame;
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  URL.createObjectURL = vi.fn(() => "blob:test-preview");
  URL.revokeObjectURL = vi.fn();
});

describe("AnimatedList component", () => {
  it("calls onItemSelect with the clicked item and index", () => {
    const onItemSelect = vi.fn();
    render(<AnimatedList items={["Alpha", "Bravo"]} onItemSelect={onItemSelect} />);

    fireEvent.click(screen.getByRole("option", { name: "Bravo" }));

    expect(onItemSelect).toHaveBeenCalledWith("Bravo", 1);
    expect(screen.getByRole("option", { name: /Bravo/ }).getAttribute("aria-selected")).toBe("true");
  });

  it("moves selection with ArrowDown and wraps with ArrowUp", () => {
    const onItemSelect = vi.fn();
    render(<AnimatedList items={["Alpha", "Bravo", "Charlie"]} onItemSelect={onItemSelect} enableArrowNavigation />);
    const listbox = screen.getByRole("listbox");

    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    expect(onItemSelect).toHaveBeenLastCalledWith("Alpha", 0);
    fireEvent.keyDown(listbox, { key: "ArrowUp" });
    expect(onItemSelect).toHaveBeenLastCalledWith("Charlie", 2);
    expect(screen.getByRole("option", { name: /Charlie/ }).getAttribute("aria-selected")).toBe("true");
  });
});

describe("Result overlay and loading feedback", () => {
  it("reveals the region confidence tooltip on hover and hides it on leave", () => {
    const result = { imageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP", answer: "", confidence: 0.87, source: "Pipeline 6" as const, regions: [{ label: "New development", bbox: [0.1, 0.2, 0.4, 0.5] as [number, number, number, number] }] };
    render(<OverlayImage result={result} />);

    const region = screen.getByRole("button", { name: /New development, 87% confidence/ });
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("opacity-0");

    fireEvent.mouseEnter(region);
    expect(tooltip.className).toContain("opacity-100");
    fireEvent.mouseLeave(region);
    expect(tooltip.className).toContain("opacity-0");
  });

  it("shows a skeleton and cycles through processing messages while the query is pending", () => {
    vi.useFakeTimers();
    mutationHarness.isPending = true;
    render(<Home />);

    expect(screen.getByText("Reading spatial context…")).toBeTruthy();
    expect(screen.getByText("The model is processing the secure image reference")).toBeTruthy();
    act(() => { vi.advanceTimersByTime(1150); });
    expect(screen.getByText("Locating visual evidence…")).toBeTruthy();
  });
});

describe("Home workspace enhancements", () => {
  it("reveals the evidence legend only after an analysis action", async () => {
    render(<Home />);

    expect(screen.queryByText("Evidence legend")).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Change Detection Example" })); });
    await waitFor(() => expect(screen.getByText("Evidence legend")).toBeTruthy());
    expect(screen.getByText("Region label")).toBeTruthy();
    expect(screen.getByText("Confidence score")).toBeTruthy();
    expect(screen.getByText("Hover to inspect")).toBeTruthy();
  });

  it("handles a dropped image with active drop feedback and local preview metadata", () => {
    render(<Home />);
    const dropZone = screen.getByRole("button", { name: "Image upload drop zone" });
    const image = new File(["image-bytes"], "demo.png", { type: "image/png" });

    fireEvent.dragEnter(dropZone);
    expect(screen.getByText("Release to load this image")).toBeTruthy();
    fireEvent.drop(dropZone, { dataTransfer: { files: [image] } });

    expect(screen.getByText(/demo\.png/)).toBeTruthy();
    expect(screen.queryByText("Release to load this image")).toBeNull();
  });

  it("clears a loaded demo result and restores the initial query state", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ imageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP", answer: "Demo answer.", confidence: 0.9, regions: [], source: "Pipeline 6", mode: "change_detection" }),
    } as Response);
    render(<Home />);

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Change Detection Example" })); });
    await waitFor(() => expect(screen.getByText("Demo answer.")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /Clear Results/ }));

    expect(screen.getByText("Your evidence will appear here")).toBeTruthy();
    expect(screen.getByText("No image selected")).toBeTruthy();
    expect((screen.getByPlaceholderText("What do you want to know about this image?") as HTMLTextAreaElement).value).toBe("Identify built-up areas and explain the dominant land-use pattern.");
  });
});

describe("Home prompt integration", () => {
  it("loads both Pipeline 6 demos through the shared result path", async () => {
    const payloads = {
      change: { imageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP", answer: "Change signal detected.", confidence: 0.91, regions: [], source: "Pipeline 6", mode: "change_detection" },
      sar: { imageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP", answer: "SAR fusion highlights the transport corridor.", confidence: 0.88, regions: [], source: "Pipeline 6", mode: "sar_fusion" },
    };
    vi.spyOn(globalThis, "fetch").mockImplementation(async (request) => {
      const kind = String(request).includes("change-detection") ? "change" : "sar";
      return { ok: true, json: async () => payloads[kind] } as Response;
    });
    render(<Home />);

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Change Detection Example" })); });
    await waitFor(() => expect(screen.getByText("Change signal detected.")).toBeTruthy());
    expect(screen.getByText("change_detection")).toBeTruthy();

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "SAR Fusion Example" })); });
    await waitFor(() => expect(screen.getByText("SAR fusion highlights the transport corridor.")).toBeTruthy());
    expect(screen.getByText("sar_fusion")).toBeTruthy();
  });

    it("updates the query field when an AnimatedList prompt is selected", () => {
    render(<Home />);
    const query = screen.getByPlaceholderText("What do you want to know about this image?") as HTMLTextAreaElement;
    fireEvent.drop(screen.getByRole("button", { name: "Image upload drop zone" }), { dataTransfer: { files: [new File(["image-bytes"], "prompt.png", { type: "image/png" })] } });
    fireEvent.click(screen.getByRole("option", { name: /Locate roads/ }));

    expect(query.value).toBe("Locate roads, water bodies, and the most visually significant structures.");
  });
});

describe("Text Query mode", () => {
  it("runs without an uploaded image and reveals post-action guidance", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ imageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP", answer: "Text mode answer.", confidence: 0.9, regions: [], source: "Prepared example", mode: "Text query" }),
    } as Response);
    render(<Home initialMode="text" />);

    expect(screen.getByRole("button", { name: "Run text query" })).toBeTruthy();
    expect(screen.queryByText("Suggested Analysis")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Run text query" }));
    await waitFor(() => expect(screen.getByText("Text mode answer.")).toBeTruthy());
    expect(screen.getByText("Suggested Analysis")).toBeTruthy();
  });
});


describe("Workspace mode, gallery, and export controls", () => {
  it("exports a completed result to PDF and creates a shareable link", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => ({ imageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP", answer: "Export answer.", confidence: 0.9, regions: [], source: "Prepared example", mode: "change_detection" }) } as Response);
    render(<Home />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Change Detection Example" })); });
    await waitFor(() => expect(screen.getByText("Export answer.")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    expect(pdfHarness.save).toHaveBeenCalledWith("geoquery-analysis.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Share analysis" }));
    await waitFor(() => expect(screen.getByText(/\/share\/test-token/)).toBeTruthy());
  });


  it("switches between Text Query and Vision Query without leaving Home", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => ({ imageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP", answer: "Gallery answer.", confidence: 0.86, regions: [], source: "Prepared example", mode: "change_detection" }) } as Response);
    render(<Home initialMode="text" />);
    expect(screen.getByRole("button", { name: "Text Query" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Vision Query" }));
    expect(screen.getByRole("button", { name: "Vision Query" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Sample gallery")).toBeTruthy();
  });

  it("loads a curated gallery item into the result workspace", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => ({ imageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP", answer: "Gallery answer.", confidence: 0.86, regions: [], source: "Prepared example", mode: "change_detection" }) } as Response);
    vi.stubGlobal("Image", class { onload?: () => void; naturalWidth = 1200; naturalHeight = 760; set src(_value: string) { queueMicrotask(() => this.onload?.()); } });
    render(<Home />);
    await waitFor(() => expect(screen.getByRole("button", { name: /Urban edge \/ optical/ })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /Urban edge \/ optical/ }));
    await waitFor(() => expect(screen.getByText(/change-earth-observation\.png/)).toBeTruthy());
    expect(screen.getByRole("button", { name: "Run vision query" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Download PDF" })).toBeNull();
  });
});


describe("Gallery Vision Query submission", () => {
  it("submits the selected PNG sample through the analyze mutation", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => ({ imageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP", answer: "Prepared gallery scene.", confidence: 0.86, regions: [], source: "Prepared example", mode: "change_detection" }) } as Response);
    vi.stubGlobal("Image", class { onload?: () => void; naturalWidth = 1200; naturalHeight = 760; set src(_value: string) { queueMicrotask(() => this.onload?.()); } });
    mutationHarness.mutate.mockImplementation((_input, options) => options?.onSuccess?.({ imageUrl: "data:image/png;base64,R0lGODlhAQABAIAAAAAAAP", answer: "Live gallery analysis.", confidence: 0.94, regions: [] }));
    render(<Home />);
    await waitFor(() => expect(screen.getByRole("button", { name: /Urban edge \/ optical/ })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /Urban edge \/ optical/ }));
    await waitFor(() => expect(screen.getByText(/change-earth-observation\.png/)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Run vision query" }));
    await waitFor(() => expect(screen.getByText("Live gallery analysis.")).toBeTruthy());
    expect(mutationHarness.mutate).toHaveBeenCalled();
    expect(mutationHarness.mutate.mock.calls.at(-1)?.[0]?.mimeType).toBe("image/png");
  });
});
