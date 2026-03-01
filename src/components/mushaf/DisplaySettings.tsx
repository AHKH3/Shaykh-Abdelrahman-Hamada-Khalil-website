"use client";

import { useRef } from "react";
import { Type, Monitor, Settings, BookOpen, Palette } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import ModalShell from "@/components/ui/ModalShell";
import MushafButton from "./ui/MushafButton";
import MushafCloseButton from "./ui/MushafCloseButton";

interface DisplaySettingsProps {
    isOpen: boolean;
    onClose: () => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    pageWidth: "normal" | "wide" | "full";
    setPageWidth: (width: "normal" | "wide" | "full") => void;
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
    pageInput,
    setPageInput,
    goToPage,
    readingMode,
    setReadingMode,
}: DisplaySettingsProps) {
    const { t, locale } = useI18n();
    const closeButtonRef = useRef<HTMLButtonElement>(null);

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

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            titleId="display-settings-title"
            initialFocusRef={closeButtonRef}
            zIndex={70}
            containerClassName="flex items-end sm:items-center justify-center p-0 sm:p-4"
            panelClassName="bg-card/95 backdrop-blur-md border border-border/40 rounded-t-3xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden max-w-lg w-full mx-auto max-h-[90vh] overflow-y-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 bg-primary/5 backdrop-blur-xl sticky top-0 z-10 relative">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60" />
                <h3 id="display-settings-title" className="font-bold text-sm flex items-center gap-2.5 text-primary whitespace-nowrap">
                    <Settings size={20} className="animate-spin-slow flex-shrink-0" />
                    <span className="whitespace-nowrap">{t.mushaf.displaySettings}</span>
                </h3>
                <MushafCloseButton
                    ref={closeButtonRef}
                    onClick={onClose}
                    iconSize={20}
                    aria-label={t.common.close}
                />
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
                        <MushafButton
                            variant="primary"
                            onClick={() => {
                                goToPage(Number(pageInput));
                                setPageInput("");
                            }}
                            className="px-6 py-3 text-sm"
                        >
                            {locale === "ar" ? "انتقال" : "Go"}
                        </MushafButton>
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
                            <MushafButton
                                key={size.value}
                                variant={fontSize === size.value ? "primary" : "ghost"}
                                onClick={() => setFontSize(size.value)}
                                className={`p-3.5 text-sm ${fontSize === size.value ? "ring-2 ring-primary/20" : "bg-muted/50"}`}
                            >
                                {size.label}
                            </MushafButton>
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
                            <MushafButton
                                key={width.value}
                                variant={pageWidth === width.value ? "primary" : "ghost"}
                                onClick={() => setPageWidth(width.value)}
                                className={`p-3 text-sm ${pageWidth !== width.value ? "bg-muted" : "bg-foreground text-background shadow-none hover:bg-foreground/90"}`}
                            >
                                <span className="whitespace-nowrap">{width.label}</span>
                            </MushafButton>
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
                            <MushafButton
                                key={mode.value}
                                variant={readingMode === mode.value ? "primary" : "ghost"}
                                onClick={() => setReadingMode(mode.value)}
                                className={`p-3 text-sm ${readingMode !== mode.value ? "bg-muted" : "bg-foreground text-background shadow-none hover:bg-foreground/90"}`}
                            >
                                <span className="whitespace-nowrap">{mode.label}</span>
                            </MushafButton>
                        ))}
                    </div>
                </div>

            </div>
        </ModalShell>
    );
}
