"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check size={20} className="shrink-0" />;
      case "error":
        return <X size={20} className="shrink-0" />;
      case "info":
        return <Info size={20} className="shrink-0" />;
      default:
        return <Info size={20} className="shrink-0" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return "bg-success text-success-foreground border-success/70";
      case "error":
        return "bg-destructive text-destructive-foreground border-destructive/70";
      case "info":
        return "bg-info text-info-foreground border-info/70";
      default:
        return "bg-info text-info-foreground border-info/70";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed bottom-8 start-1/2 -translate-x-1/2 z-[var(--z-toast)] flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg border ${getColors()} max-w-md mx-4`}
    >
      {getIcon()}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ms-2 hover:opacity-80 transition-opacity"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-[var(--z-toast)] flex flex-col items-center gap-2 p-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="pointer-events-auto"
          >
            <div className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg border ${
              toast.type === "success" ? "bg-success text-success-foreground border-success/70" :
              toast.type === "error" ? "bg-destructive text-destructive-foreground border-destructive/70" :
              "bg-info text-info-foreground border-info/70"
            } max-w-md`}>
              {toast.type === "success" && <Check size={20} className="shrink-0" />}
              {toast.type === "error" && <X size={20} className="shrink-0" />}
              {toast.type === "info" && <Info size={20} className="shrink-0" />}
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ms-2 hover:opacity-80 transition-opacity"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
