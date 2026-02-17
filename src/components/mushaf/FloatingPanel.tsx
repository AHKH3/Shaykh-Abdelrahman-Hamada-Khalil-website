"use client";

import { useRef, type ReactNode } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import { X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useFloatingPanel } from "@/lib/hooks/useFloatingPanel";

interface FloatingPanelProps {
  id: string;
  title: string;
  icon: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  minWidth?: number;
  defaultPanelHeight?: number;
  zIndex?: number;
}

export default function FloatingPanel({
  id,
  title,
  icon,
  isOpen,
  onClose,
  children,
  minWidth = 300,
  defaultPanelHeight = 350,
  zIndex = 60,
}: FloatingPanelProps) {
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const { position, isCollapsed, collapsedEdge, onDragEnd, collapse, expand } =
    useFloatingPanel(id, minWidth, defaultPanelHeight);

  const motionX = useMotionValue(position.x);
  const motionY = useMotionValue(position.y);

  if (!isOpen) return null;

  // Mobile: render as bottom sheet
  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: isCollapsed ? "85%" : 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", bounce: 0.2 }}
          style={{ zIndex }}
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/80 rounded-t-2xl shadow-2xl shadow-black/20"
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-border/60 cursor-pointer select-none"
            onClick={isCollapsed ? expand : collapse}
          >
            {/* Drag indicator */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-muted-foreground/30 rounded-full" />
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground mt-1">
              <span className="text-primary">{icon}</span>
              {title}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {isCollapsed ? (
                <ChevronUp size={15} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={15} className="text-muted-foreground" />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={15} />
              </button>
            </div>
          </div>
          {!isCollapsed && (
            <div className="max-h-[60vh] overflow-y-auto">{children}</div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Collapsed pill view — snapped to edge
  if (isCollapsed) {
    const isVerticalEdge = collapsedEdge === "left" || collapsedEdge === "right";
    const pillStyle: React.CSSProperties = {
      position: "fixed",
      zIndex,
      ...(collapsedEdge === "left" && { left: 0, top: Math.max(60, position.y) }),
      ...(collapsedEdge === "right" && { right: 0, top: Math.max(60, position.y) }),
      ...(collapsedEdge === "top" && { top: 0, left: Math.max(10, position.x) }),
      ...(collapsedEdge === "bottom" && { bottom: 0, left: Math.max(10, position.x) }),
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.25 }}
        style={pillStyle}
        className={`flex items-center gap-1.5 bg-card border border-border/80 shadow-lg shadow-black/10 cursor-pointer transition-colors select-none group ${
          isVerticalEdge
            ? "flex-col py-3 px-2 rounded-e-xl hover:bg-accent"
            : "flex-row px-3 py-2 rounded-b-xl hover:bg-accent"
        }`}
        onClick={expand}
        title={title}
      >
        <div className="text-primary group-hover:scale-110 transition-transform">{icon}</div>
        {collapsedEdge === "right" ? (
          <ChevronLeft size={13} className="text-muted-foreground" />
        ) : collapsedEdge === "left" ? (
          <ChevronRight size={13} className="text-muted-foreground" />
        ) : collapsedEdge === "top" ? (
          <ChevronDown size={13} className="text-muted-foreground" />
        ) : (
          <ChevronUp size={13} className="text-muted-foreground" />
        )}
      </motion.div>
    );
  }

  // Expanded floating panel
  return (
    <motion.div
      ref={panelRef}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        x: motionX,
        y: motionY,
        zIndex,
        minWidth,
        maxWidth: Math.min(minWidth + 80, typeof window !== "undefined" ? window.innerWidth - 20 : 400),
      }}
      initial={{ x: position.x, y: position.y, opacity: 0, scale: 0.94 }}
      animate={{ x: position.x, y: position.y, opacity: 1, scale: 1 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
      onDragEnd={(_, info) => {
        const newX = position.x + info.offset.x;
        const newY = position.y + info.offset.y;
        onDragEnd(newX, newY);
      }}
      className="bg-card border border-border/80 rounded-2xl shadow-2xl shadow-black/15 overflow-hidden"
    >
      {/* Drag Handle / Title Bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/20 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground pointer-events-none">
          <span className="text-primary">{icon}</span>
          {title}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={collapse}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="تصغير"
          >
            <ChevronDown size={13} />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
            title="إغلاق"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[calc(100vh-120px)] overflow-y-auto">{children}</div>
    </motion.div>
  );
}
