"use client";

import { useState, useEffect, useCallback } from "react";

export interface FloatingPanelPosition {
  x: number;
  y: number;
}

export interface FloatingPanelState {
  position: FloatingPanelPosition;
  isCollapsed: boolean;
  collapsedEdge: "left" | "right" | "top" | "bottom";
}

const EDGE_SNAP_THRESHOLD = 40;

function getDefaultPosition(id: string): FloatingPanelPosition {
  if (typeof window === "undefined") return { x: 20, y: 20 };
  const isRTL = document.documentElement.dir === "rtl";
  const isMobile = window.innerWidth < 640;
  if (isMobile) return { x: 0, y: window.innerHeight - 200 };
  if (id === "audio-player") {
    return isRTL
      ? { x: 20, y: window.innerHeight - 220 }
      : { x: window.innerWidth - 320, y: window.innerHeight - 220 };
  }
  return isRTL
    ? { x: window.innerWidth - 320, y: window.innerHeight - 400 }
    : { x: 20, y: window.innerHeight - 400 };
}

function getNearestEdge(
  x: number,
  y: number,
  panelWidth: number,
  panelHeight: number
): "left" | "right" | "top" | "bottom" {
  if (typeof window === "undefined") return "right";
  const distLeft = x;
  const distRight = window.innerWidth - (x + panelWidth);
  const distTop = y;
  const distBottom = window.innerHeight - (y + panelHeight);
  const minDist = Math.min(distLeft, distRight, distTop, distBottom);
  if (minDist === distLeft) return "left";
  if (minDist === distRight) return "right";
  if (minDist === distTop) return "top";
  return "bottom";
}

export function useFloatingPanel(id: string, defaultPanelWidth = 300, defaultPanelHeight = 350) {
  const storageKey = `floating-panel-${id}`;

  const [state, setState] = useState<FloatingPanelState>(() => {
    if (typeof window === "undefined") {
      return { position: { x: 20, y: 20 }, isCollapsed: false, collapsedEdge: "right" };
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as FloatingPanelState;
        // Clamp to viewport
        const clampedX = Math.max(0, Math.min(parsed.position.x, window.innerWidth - 50));
        const clampedY = Math.max(0, Math.min(parsed.position.y, window.innerHeight - 50));
        return { ...parsed, position: { x: clampedX, y: clampedY } };
      }
    } catch {
      // ignore
    }
    return {
      position: getDefaultPosition(id),
      isCollapsed: false,
      collapsedEdge: "right",
    };
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, storageKey]);

  // Keep panel in bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setState((prev) => ({
        ...prev,
        position: {
          x: Math.max(0, Math.min(prev.position.x, window.innerWidth - 50)),
          y: Math.max(0, Math.min(prev.position.y, window.innerHeight - 50)),
        },
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const setPosition = useCallback((pos: FloatingPanelPosition) => {
    setState((prev) => ({ ...prev, position: pos }));
  }, []);

  const onDragEnd = useCallback(
    (finalX: number, finalY: number) => {
      const edge = getNearestEdge(finalX, finalY, defaultPanelWidth, defaultPanelHeight);
      const distLeft = finalX;
      const distRight = window.innerWidth - (finalX + defaultPanelWidth);
      const distTop = finalY;
      const distBottom = window.innerHeight - (finalY + defaultPanelHeight);
      const minDist = Math.min(distLeft, distRight, distTop, distBottom);

      if (minDist < EDGE_SNAP_THRESHOLD) {
        // Snap to nearest edge
        let snappedX = finalX;
        let snappedY = finalY;
        if (edge === "left") snappedX = 0;
        if (edge === "right") snappedX = window.innerWidth - defaultPanelWidth;
        if (edge === "top") snappedY = 0;
        if (edge === "bottom") snappedY = window.innerHeight - defaultPanelHeight;

        setState((prev) => ({
          ...prev,
          position: { x: snappedX, y: snappedY },
        }));
      } else {
        setState((prev) => ({ ...prev, position: { x: finalX, y: finalY } }));
      }
    },
    [defaultPanelWidth, defaultPanelHeight]
  );

  const collapse = useCallback(() => {
    setState((prev) => {
      const edge = getNearestEdge(
        prev.position.x,
        prev.position.y,
        defaultPanelWidth,
        defaultPanelHeight
      );
      return { ...prev, isCollapsed: true, collapsedEdge: edge };
    });
  }, [defaultPanelWidth, defaultPanelHeight]);

  const expand = useCallback(() => {
    setState((prev) => ({ ...prev, isCollapsed: false }));
  }, []);

  return {
    position: state.position,
    isCollapsed: state.isCollapsed,
    collapsedEdge: state.collapsedEdge,
    setPosition,
    onDragEnd,
    collapse,
    expand,
  };
}
