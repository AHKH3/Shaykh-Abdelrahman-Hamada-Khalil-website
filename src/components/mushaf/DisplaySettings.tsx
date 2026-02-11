"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Type, Monitor, Layout, Settings, Volume2, BookOpen, Palette } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { RECITERS } from "@/lib/quran/api";

interface DisplaySettingsProps {
    isOpen: boolean;
    onClose: () => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    pageWidth: "normal" | "wide" | "full";
    setPageWidth: (width: "normal" | "wide" | "full") => void;
    displayMode: "single" | "double";
    setDisplayMode: (mode: "single" | "double") => void;
    selectedReciter: number;
    setSelectedReciter: (reciter: number) => void;
    pageInput: string;
    setPageInput: (input: string) => void;
    goToPage: (page: number) => void;
    readingMode: "normal" | "sepia" | "dark";
    setReadingMode: (mode: "normal" | "sepia" | "dark") => void;
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
    selectedReciter,
    setSelectedReciter,
    pageInput,
    setPageInput,
    goToPage,
    readingMode,
    setReadingMode,
}: DisplaySettingsProps) {
    const { t, locale, dir } = useI18n();

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
        { value: "normal" as const, label: locale === "ar" ? "عادي" : "Normal" },
        { value: "sepia" as const, label: t.mushaf.sepia },
        { value: "dark" as const, label: locale === "ar" ? "داكن" : "Dark" },
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
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                    className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full mx-auto max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50 sticky top-0 z-10">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Settings size={18} />
                            {t.mushaf.displaySettings}
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
                    <div className="p-4 space-y-6">
                        {/* Reciter Selection */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium mb-3">
                                <Volume2 size={16} className="text-muted-foreground" />
                                {t.mushaf.reciter}
                            </label>
                            <select
                                value={selectedReciter}
                                onChange={(e) => setSelectedReciter(Number(e.target.value))}
                                className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                {RECITERS.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {locale === "ar" ? r.name : r.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

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
                                    className="flex-1 text-sm bg-muted border border-border rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    dir="ltr"
                                    placeholder="1-604"
                                />
                                <button
                                    onClick={() => {
                                        goToPage(Number(pageInput));
                                        setPageInput("");
                                    }}
                                    className="px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
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
                                        className={`p-3 rounded-lg text-sm font-medium transition-colors ${fontSize === size.value
                                                ? "bg-foreground text-background"
                                                : "bg-muted hover:bg-muted/80"
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
