export type SidebarDockSide = "left" | "right";

interface SidebarRect {
  left: number;
  right: number;
}

export function resolveSidebarDockSide(
  rect: SidebarRect,
  viewportWidth: number
): SidebarDockSide {
  const distanceToLeft = Math.max(rect.left, 0);
  const distanceToRight = Math.max(viewportWidth - rect.right, 0);

  return distanceToLeft <= distanceToRight ? "left" : "right";
}

export function getSidebarPointerResizeDelta(
  startX: number,
  currentX: number,
  dockSide: SidebarDockSide
): number {
  const pointerDelta = currentX - startX;
  return dockSide === "left" ? pointerDelta : -pointerDelta;
}

export function getSidebarKeyboardResizeDelta(
  key: "ArrowLeft" | "ArrowRight",
  step: number,
  dockSide: SidebarDockSide
): number {
  const arrowDirection = key === "ArrowRight" ? 1 : -1;
  return dockSide === "left" ? arrowDirection * step : -arrowDirection * step;
}
