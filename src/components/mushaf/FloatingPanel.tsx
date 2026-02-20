"use client";

import { useRef, type ReactNode, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import { X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Pin, PinOff, Play, Pause, Brain, BarChart3 } from "lucide-react";
import { useFloatingPanel } from "@/lib/hooks/useFloatingPanel";

interface CollapsedInfo {
  rangeReference?: string;
  progress?: number;
  mode?: "memorization" | "progress" | "range";
  isPlaying?: boolean;
  verseCount?: number;
}

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
  collapsedInfo?: CollapsedInfo;
  autoCollapseDelay?: number;
  onExpandChange?: (isExpanded: boolean) => void;
}

// Mode colors for visual feedback
const modeColors = {
  memorization: "bg-blue-500/20 border-blue-500/50 text-blue-600 dark:text-blue-400",
  progress: "bg-purple-500/20 border-purple-500/50 text-purple-600 dark:text-purple-400",
  range: "bg-primary/20 border-primary/50 text-primary",
};

const modeIcons = {
  memorization: Brain,
  progress: BarChart3,
  range: null,
};

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
  collapsedInfo,
  autoCollapseDelay = 0,
  onExpandChange,
}: FloatingPanelProps) {
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [isHoveringCollapsed, setIsHoveringCollapsed] = useState(false);

  const { position, isCollapsed, collapsedEdge, onDragEnd, collapse, expand } =
    useFloatingPanel(id, minWidth, defaultPanelHeight);

  const motionX = useMotionValue(position.x);
  const motionY = useMotionValue(position.y);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load pinned state from localStorage
  useEffect(() => {
    const savedPin = localStorage.getItem(`floating-panel-${id}-pinned`);
    if (savedPin) setIsPinned(savedPin === "true");
  }, [id]);

  // Save pinned state
  const togglePin = useCallback(() => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    localStorage.setItem(`floating-panel-${id}-pinned`, String(newPinned));
  }, [id, isPinned]);

  // Auto-collapse after inactivity
  useEffect(() => {
    if (!autoCollapseDelay || autoCollapseDelay === 0 || isPinned || isCollapsed || !isOpen) return;

    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      const timer = setTimeout(() => {
        if (!isPinned) {
          collapse();
          onExpandChange?.(false);
        }
      }, autoCollapseDelay * 1000);
      setInactivityTimer(timer);
    };

    resetTimer();

    // Reset on user interaction
    const handleInteraction = () => resetTimer();
    const panel = panelRef.current;
    panel?.addEventListener("mousemove", handleInteraction);
    panel?.addEventListener("click", handleInteraction);

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      panel?.removeEventListener("mousemove", handleInteraction);
      panel?.removeEventListener("click", handleInteraction);
    };
  }, [autoCollapseDelay, isPinned, isCollapsed, isOpen, collapse, onExpandChange, inactivityTimer]);

  // Notify parent of expand/collapse changes
  const handleExpand = useCallback(() => {
    expand();
    onExpandChange?.(true);
  }, [expand, onExpandChange]);

  const handleCollapse = useCallback(() => {
    collapse();
    onExpandChange?.(false);
  }, [collapse, onExpandChange]);

  if (!isOpen) return null;

  // Mobile: render as bottom sheet
  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: isCollapsed && !isHoveringCollapsed ? "85%" : 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", bounce: 0.2 }}
          style={{ zIndex }}
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/80 rounded-t-2xl shadow-2xl shadow-black/20"
        >
          {/* Drag handle */}
          <div className="flex items-center justify-center pt-2">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-border/60 cursor-pointer select-none"
            onClick={isCollapsed ? handleExpand : undefined}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="text-primary">{icon}</span>
              {title}
              {collapsedInfo?.rangeReference && isCollapsed && (
                <span className="text-xs text-muted-foreground font-normal mr-2">
                  {collapsedInfo.rangeReference}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!isCollapsed && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(); }}
                    className={`p-1.5 rounded-lg transition-colors ${isPinned ? "bg-primary/20 text-primary" : "hover:bg-accent text-muted-foreground hover:text-foreground"}`}
                    title={isPinned ? "إلغاء التثبيت" : "تثبيت"}
                  >
                    {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCollapse(); }}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown size={15} />
                  </button>
                </>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Progress bar for collapsed state */}
          {isCollapsed && collapsedInfo?.progress !== undefined && (
            <div className="px-4 pb-3">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${collapsedInfo.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Content */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="max-h-[60vh] overflow-y-auto"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Collapsed pill view — snapped to edge with enhanced info
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

    const ModeIcon = collapsedInfo?.mode ? modeIcons[collapsedInfo.mode] : null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.25 }}
        style={pillStyle}
        className={`group cursor-pointer select-none ${isVerticalEdge
          ? "flex flex-col items-center"
          : "flex flex-row items-center"
          }`}
        onClick={handleExpand}
        onMouseEnter={() => setIsHoveringCollapsed(true)}
        onMouseLeave={() => setIsHoveringCollapsed(false)}
      >
        {/* Main collapsed pill */}
        <div
          className={`flex items-center gap-2 bg-card border border-border/80 shadow-lg shadow-black/10 transition-all duration-200 hover:shadow-xl hover:bg-accent/50 ${isVerticalEdge
            ? "flex-col py-3 px-2.5 rounded-e-xl"
            : "flex-row px-4 py-2.5 rounded-b-xl"
            }`}
        >
          {/* Icon with mode indicator */}
          <div className="relative">
            <motion.div
              className="text-primary"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {icon}
            </motion.div>

            {/* Playing indicator */}
            {collapsedInfo?.isPlaying && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>

          {/* Range reference and progress */}
          {collapsedInfo?.rangeReference && (
            <div className={`flex flex-col ${isVerticalEdge ? "items-center" : "items-start"}`}>
              <span className="text-xs font-medium text-foreground whitespace-nowrap">
                {collapsedInfo.rangeReference}
              </span>

              {/* Progress bar */}
              {collapsedInfo.progress !== undefined && (
                <div className={`mt-1 ${isVerticalEdge ? "w-8" : "w-16"} h-1 bg-muted rounded-full overflow-hidden`}>
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${collapsedInfo.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Mode badge */}
          {collapsedInfo?.mode && collapsedInfo.mode !== "range" && ModeIcon && (
            <div className={`flex items-center justify-center p-1 rounded-full border ${modeColors[collapsedInfo.mode]}`}>
              <ModeIcon size={12} />
            </div>
          )}

          {/* Verse count badge */}
          {collapsedInfo?.verseCount && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-full font-medium"
            >
              {collapsedInfo.verseCount}
            </motion.span>
          )}

          {/* Expand arrow */}
          {collapsedEdge === "right" ? (
            <ChevronLeft size={14} className="text-muted-foreground" />
          ) : collapsedEdge === "left" ? (
            <ChevronRight size={14} className="text-muted-foreground" />
          ) : collapsedEdge === "top" ? (
            <ChevronDown size={14} className="text-muted-foreground" />
          ) : (
            <ChevronUp size={14} className="text-muted-foreground" />
          )}
        </div>

        {/* Hover preview - expand hint */}
        <AnimatePresence>
          {isHoveringCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute bg-card/95 backdrop-blur-sm border border-border/60 rounded-lg shadow-lg px-3 py-2 text-xs text-muted-foreground whitespace-nowrap ${collapsedEdge === "right" ? "right-full mr-2" :
                collapsedEdge === "left" ? "left-full ml-2" :
                  collapsedEdge === "top" ? "top-full mt-2" :
                    "bottom-full mb-2"
                }`}
            >
              انقر للتوسيع
            </motion.div>
          )}
        </AnimatePresence>
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
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
      onDragEnd={(_, info) => {
        const newX = position.x + info.offset.x;
        const newY = position.y + info.offset.y;
        onDragEnd(newX, newY);
      }}
      className="bg-card border border-border/80 rounded-2xl shadow-2xl shadow-black/15 overflow-hidden"
    >
      {/* Active range indicator border */}
      {collapsedInfo?.rangeReference && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: collapsedInfo.isPlaying
              ? ["0 0 0 0px rgba(34, 197, 94, 0.4)", "0 0 0 4px rgba(34, 197, 94, 0)", "0 0 0 0px rgba(34, 197, 94, 0.4)"]
              : "0 0 0 2px rgba(var(--color-primary), 0.3)",
          }}
          transition={collapsedInfo.isPlaying ? { duration: 2, repeat: Infinity } : { duration: 0 }}
        />
      )}

      {/* Drag Handle / Title Bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/20 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground pointer-events-none">
          <span className="text-primary">{icon}</span>
          {title}

          {/* Active range badge */}
          {collapsedInfo?.rangeReference && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-normal"
            >
              {collapsedInfo.rangeReference}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {/* Pin button */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={togglePin}
            className={`p-1.5 rounded-lg transition-colors ${isPinned ? "bg-primary/20 text-primary" : "hover:bg-accent text-muted-foreground hover:text-foreground"}`}
            title={isPinned ? "إلغاء التثبيت" : "تثبيت"}
          >
            {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
          </button>

          {/* Collapse button */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleCollapse}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="تصغير"
          >
            <ChevronDown size={13} />
          </button>

          {/* Close button */}
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
