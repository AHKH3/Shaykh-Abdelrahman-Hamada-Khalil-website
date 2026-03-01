"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { useOverlayA11y } from "@/lib/hooks/useOverlayA11y";

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  titleId?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  zIndex?: number;
  backdropClassName?: string;
  containerClassName?: string;
  panelClassName?: string;
  panelStyle?: CSSProperties;
}

export default function ModalShell({
  isOpen,
  onClose,
  children,
  titleId,
  initialFocusRef,
  closeOnEsc = true,
  closeOnBackdrop = true,
  zIndex = 50,
  backdropClassName = "bg-black/50 backdrop-blur-sm",
  containerClassName = "flex items-center justify-center p-4",
  panelClassName = "w-full",
  panelStyle,
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useOverlayA11y({
    isOpen,
    onClose,
    dialogRef,
    initialFocusRef,
    closeOnEsc,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={`fixed inset-0 ${backdropClassName}`}
          style={{ zIndex }}
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <div className={`h-full w-full ${containerClassName}`}>
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={panelClassName}
              style={panelStyle}
              onClick={(event) => event.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
