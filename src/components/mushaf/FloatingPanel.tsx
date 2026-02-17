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
  zIndex = 45,
}: FloatingPanelProps) {
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const { position, isCollapsed, collapsedEdge, setPosition, onDragEnd, collapse, expand } =
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
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl shadow-2xl"
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-border cursor-pointer"
            onClick={isCollapsed ? expand : collapse}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {icon}
              {title}
            </div>
            <div className="flex items-center gap-1">
              {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <X size={16} />
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
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={pillStyle}
        className={`flex items-center gap-1 bg-card border border-border shadow-lg cursor-pointer hover:bg-muted/80 transition-colors select-none ${
          isVerticalEdge
            ? "flex-col py-3 px-2 rounded-e-xl"
            : "flex-row px-3 py-2 rounded-b-xl"
        }`}
        onClick={expand}
        title={title}
      >
        <div className="text-primary">{icon}</div>
        {collapsedEdge === "right" ? (
          <ChevronLeft size={14} className="text-muted-foreground" />
        ) : collapsedEdge === "left" ? (
          <ChevronRight size={14} className="text-muted-foreground" />
        ) : collapsedEdge === "top" ? (
          <ChevronDown size={14} className="text-muted-foreground" />
        ) : (
          <ChevronUp size={14} className="text-muted-foreground" />
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
      initial={{ x: position.x, y: position.y, opacity: 0, scale: 0.95 }}
      animate={{ x: position.x, y: position.y, opacity: 1, scale: 1 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
      onDragEnd={(_, info) => {
        const newX = position.x + info.offset.x;
        const newY = position.y + info.offset.y;
        onDragEnd(newX, newY);
      }}
      className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Drag Handle / Title Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="flex items-center gap-2 text-sm font-medium pointer-events-none">
          {icon}
          {title}
        </div>
        <div className="flex items-center gap-1">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={collapse}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="تصغير"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="إغلاق"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[calc(100vh-120px)] overflow-y-auto">{children}</div>
    </motion.div>
  );
}
