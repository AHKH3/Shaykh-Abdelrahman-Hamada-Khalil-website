"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Repeat, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface RepeatModeProps {
    isOpen: boolean;
    onClose: () => void;
    onRepeat: (count: number) => void;
}

export default function RepeatMode({ isOpen, onClose, onRepeat }: RepeatModeProps) {
    const { t, locale } = useI18n();
    const [repeatCount, setRepeatCount] = useState(3);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                    className="absolute bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-w-md sm:w-full mx-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Repeat size={18} />
                            {t.mushaf.repeatMode}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            aria-label={t.common.close}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <label className="flex items-center gap-2 text-sm font-medium mb-4">
                            <Volume2 size={16} className="text-muted-foreground" />
                            {t.mushaf.repeatCount}
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 5, 10].map((count) => (
                                <button
                                    key={count}
                                    onClick={() => setRepeatCount(count)}
                                    className={`p-4 rounded-lg text-lg font-medium transition-colors ${repeatCount === count
                                            ? "bg-foreground text-background"
                                            : "bg-muted hover:bg-muted/80"
                                        }`}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border bg-muted/50 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            {locale === "ar" ? "سيتم تكرار الآية" : "Verse will be repeated"} {repeatCount}{" "}
                            {locale === "ar" ? "مرات" : "times"}
                        </span>
                        <button
                            onClick={() => onRepeat(repeatCount)}
                            className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-colors"
                        >
                            {locale === "ar" ? "تكرار" : "Repeat"}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
