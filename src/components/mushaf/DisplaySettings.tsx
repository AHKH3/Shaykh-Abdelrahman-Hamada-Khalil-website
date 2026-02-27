"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Type, Monitor, Layout, Settings, BookOpen, Palette } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface DisplaySettingsProps {
    isOpen: boolean;
    onClose: () => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    pageWidth: "normal" | "wide" | "full";
    setPageWidth: (width: "normal" | "wide" | "full") => void;
    displayMode: "single" | "double";
    setDisplayMode: (mode: "single" | "double") => void;
    pageInput: string;
    setPageInput: (input: string) => void;
    goToPage: (page: number) => void;
    readingMode: "normal" | "sepia" | "green" | "purple" | "blue" | "red" | "pink" | "highContrast";
    setReadingMode: (mode: "normal" | "sepia" | "green" | "purple" | "blue" | "red" | "pink" | "highContrast") => void;
}

export default function DisplaySettings({
    isOpen,
    onClose,
    fontSize,
    setFontSize,
    pageWidth,
    setPageWidth,
    displayMode,
    setDisplayMode,
    pageInput,
    setPageInput,
    goToPage,
    readingMode,
    setReadingMode,
}: DisplaySettingsProps) {
    const { t, locale } = useI18n();

    const fontSizes = [
        { value: 24, label: locale === "ar" ? "صغير" : "Small" },
        { value: 32, label: locale === "ar" ? "متوسط" : "Medium" },
        { value: 40, label: locale === "ar" ? "كبير" : "Large" },
        { value: 48, label: locale === "ar" ? "كبير جداً" : "Extra Large" },
    ];

    const pageWidths = [
        { value: "normal" as const, label: t.mushaf.normal },
        { value: "wide" as const, label: t.mushaf.wide },
        { value: "full" as const, label: t.mushaf.fullWidth },
    ];

    const displayModes = [
        { value: "single" as const, label: t.mushaf.singlePage },
        { value: "double" as const, label: t.mushaf.doublePage },
    ];

    const readingModes = [
        { value: "normal" as const, label: t.mushaf.normal },
        { value: "sepia" as const, label: t.mushaf.sepia },
        { value: "green" as const, label: t.mushaf.green },
        { value: "purple" as const, label: t.mushaf.purple },
        { value: "blue" as const, label: t.mushaf.blue },
        { value: "red" as const, label: t.mushaf.red },
        { value: "pink" as const, label: t.mushaf.pink },
        { value: "highContrast" as const, label: t.mushaf.highContrast },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    className="bg-card/95 backdrop-blur-2xl border border-border/40 rounded-t-3xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden max-w-lg w-full mx-auto max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-border/40 bg-primary/5 backdrop-blur-md sticky top-0 z-10">
                        <h3 className="font-bold text-sm flex items-center gap-2.5 text-primary">
                            <Settings size={20} className="animate-spin-slow" />
                            {t.mushaf.displaySettings}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-muted/80 transition-all hover:rotate-90 duration-300"
                            aria-label={t.common.close}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-6">
                        {/* Go to Page */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium mb-3">
                                <BookOpen size={16} className="text-muted-foreground" />
                                {t.mushaf.goToPage}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    max={604}
                                    value={pageInput}
                                    onChange={(e) => setPageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            goToPage(Number(pageInput));
                                            setPageInput("");
                                        }
                                    }}
                                    className="flex-1 text-sm bg-muted/50 backdrop-blur-sm border border-border/40 rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                    dir="ltr"
                                    placeholder="1-604"
                                />
                                <button
                                    onClick={() => {
                                        goToPage(Number(pageInput));
                                        setPageInput("");
                                    }}
                                    className="px-6 py-3 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                                >
                                    {locale === "ar" ? "انتقال" : "Go"}
                                </button>
                            </div>
                        </div>

                        {/* Font Size */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium mb-3">
                                <Type size={16} className="text-muted-foreground" />
                                {t.mushaf.fontSize}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {fontSizes.map((size) => (
                                    <button
                                        key={size.value}
                                        onClick={() => setFontSize(size.value)}
                                        className={`p-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${fontSize === size.value
                                            ? "bg-primary text-white shadow-lg shadow-primary/20 ring-2 ring-primary/20"
                                            : "bg-muted/50 hover:bg-primary/10 hover:text-primary"
                                            }`}
                                    >
                                        {size.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Page Width */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium mb-3">
                                <Monitor size={16} className="text-muted-foreground" />
                                {t.mushaf.pageWidth}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {pageWidths.map((width) => (
                                    <button
                                        key={width.value}
                                        onClick={() => setPageWidth(width.value)}
                                        className={`p-3 rounded-lg text-sm font-medium transition-colors ${pageWidth === width.value
                                            ? "bg-foreground text-background"
                                            : "bg-muted hover:bg-muted/80"
                                            }`}
                                    >
                                        {width.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Display Mode */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium mb-3">
                                <Layout size={16} className="text-muted-foreground" />
                                {t.mushaf.displayMode}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {displayModes.map((mode) => (
                                    <button
                                        key={mode.value}
                                        onClick={() => setDisplayMode(mode.value)}
                                        className={`p-3 rounded-lg text-sm font-medium transition-colors ${displayMode === mode.value
                                            ? "bg-foreground text-background"
                                            : "bg-muted hover:bg-muted/80"
                                            }`}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reading Mode */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium mb-3">
                                <Palette size={16} className="text-muted-foreground" />
                                {t.mushaf.readingMode}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {readingModes.map((mode) => (
                                    <button
                                        key={mode.value}
                                        onClick={() => setReadingMode(mode.value)}
                                        className={`p-3 rounded-lg text-sm font-medium transition-colors ${readingMode === mode.value
                                            ? "bg-foreground text-background"
                                            : "bg-muted hover:bg-muted/80"
                                            }`}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
