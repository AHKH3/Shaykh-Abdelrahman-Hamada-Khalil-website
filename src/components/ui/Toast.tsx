"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertCircle, Info } from "lucide-react";

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
        return "bg-green-500 text-white border-green-600";
      case "error":
        return "bg-red-500 text-white border-red-600";
      case "info":
        return "bg-blue-500 text-white border-blue-600";
      default:
        return "bg-blue-500 text-white border-blue-600";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg border ${getColors()} max-w-md mx-4`}
    >
      {getIcon()}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-80 transition-opacity"
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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center gap-2 p-4 pointer-events-none">
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
              toast.type === "success" ? "bg-green-500 text-white border-green-600" :
              toast.type === "error" ? "bg-red-500 text-white border-red-600" :
              "bg-blue-500 text-white border-blue-600"
            } max-w-md`}>
              {toast.type === "success" && <Check size={20} className="shrink-0" />}
              {toast.type === "error" && <X size={20} className="shrink-0" />}
              {toast.type === "info" && <Info size={20} className="shrink-0" />}
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 hover:opacity-80 transition-opacity"
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
