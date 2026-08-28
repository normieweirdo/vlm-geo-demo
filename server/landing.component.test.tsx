// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Landing from "../client/src/pages/Landing";

afterEach(() => cleanup());

describe("Landing page entry flow", () => {
  it("presents the mission narrative and both query entry choices", () => {
    const onEnter = vi.fn();
    render(<Landing onEnter={onEnter} />);

    expect(screen.getByText("Read the Earth")).toBeTruthy();
    expect(screen.getByText(/GeoQuery turns Earth observation imagery/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Start with an image/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Ask a text query/ })).toBeTruthy();
  });

  it("returns the selected mode to the entry shell", () => {
    const onEnter = vi.fn();
    render(<Landing onEnter={onEnter} />);

    fireEvent.click(screen.getByRole("button", { name: /Start with an image/ }));
    fireEvent.click(screen.getByRole("button", { name: /Ask a text query/ }));

    expect(onEnter).toHaveBeenNthCalledWith(1, "vision");
    expect(onEnter).toHaveBeenNthCalledWith(2, "text");
  });
});


  it("updates the landing parallax variables on pointer movement", () => {
    Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: false }) });
    render(<Landing onEnter={vi.fn()} />);
    const landing = screen.getByRole("main");
    Object.defineProperty(landing, "getBoundingClientRect", { value: () => ({ left: 0, top: 0, width: 1000, height: 600 }) });
    fireEvent.pointerMove(landing, { clientX: 900, clientY: 100 });
    expect(landing.style.getPropertyValue("--parallax-x")).not.toBe("0px");
    expect(landing.style.getPropertyValue("--parallax-y")).not.toBe("0px");
  });

  it("does not update parallax when reduced motion is preferred", () => {
    Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: true }) });
    render(<Landing onEnter={vi.fn()} />);
    const landing = screen.getByRole("main");
    Object.defineProperty(landing, "getBoundingClientRect", { value: () => ({ left: 0, top: 0, width: 1000, height: 600 }) });
    fireEvent.pointerMove(landing, { clientX: 900, clientY: 100 });
    expect(landing.style.getPropertyValue("--parallax-x")).toBe("");
    expect(landing.style.getPropertyValue("--parallax-y")).toBe("");
  });


  it("shows the Ask, Detect, Explain workflow sequence", () => {
    render(<Landing onEnter={vi.fn()} />);
    const workflow = screen.getByTestId("workflow-sequence");
    expect(workflow.getAttribute("aria-label")).toBe("Ask, Detect, Explain workflow");
    expect(screen.getByText("Ask")).toBeTruthy();
    expect(screen.getByText("Detect")).toBeTruthy();
    expect(screen.getByText("Explain")).toBeTruthy();
  });

  it("updates parallax variables from touch movement", () => {
    Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: false }) });
    render(<Landing onEnter={vi.fn()} />);
    const landing = screen.getByRole("main");
    Object.defineProperty(landing, "getBoundingClientRect", { value: () => ({ left: 0, top: 0, width: 1000, height: 600 }) });
    fireEvent.touchMove(landing, { touches: [{ clientX: 850, clientY: 120 }] });
    expect(landing.style.getPropertyValue("--parallax-x")).not.toBe("");
    expect(landing.style.getPropertyValue("--parallax-y")).not.toBe("");
  });


  it("renders the GeoQuery evidence and query mark", () => {
    render(<Landing onEnter={vi.fn()} />);
    expect(screen.getByTestId("geoquery-mark")).toBeTruthy();
  });
