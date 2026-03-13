import { describe, expect, it } from "vitest";
import {
  getSidebarKeyboardResizeDelta,
  getSidebarPointerResizeDelta,
  resolveSidebarDockSide,
} from "./tafsir-sidebar-resize";

describe("tafsir sidebar resize helpers", () => {
  it("detects whether the sidebar is docked to the left or right edge", () => {
    expect(resolveSidebarDockSide({ left: 24, right: 424 }, 1440)).toBe("left");
    expect(resolveSidebarDockSide({ left: 1016, right: 1416 }, 1440)).toBe("right");
  });

  it("grows width in the same physical direction as the handle drag", () => {
    expect(getSidebarPointerResizeDelta(300, 360, "left")).toBe(60);
    expect(getSidebarPointerResizeDelta(300, 240, "right")).toBe(60);
  });

  it("maps keyboard arrows to the rendered sidebar edge", () => {
    expect(getSidebarKeyboardResizeDelta("ArrowRight", 12, "left")).toBe(12);
    expect(getSidebarKeyboardResizeDelta("ArrowLeft", 12, "left")).toBe(-12);
    expect(getSidebarKeyboardResizeDelta("ArrowRight", 12, "right")).toBe(-12);
    expect(getSidebarKeyboardResizeDelta("ArrowLeft", 12, "right")).toBe(12);
  });
});
