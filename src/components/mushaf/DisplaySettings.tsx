"use client";

import { useRef, useState } from "react";
import { Type, Monitor, Settings, Palette, Keyboard, ChevronDown, RotateCcw, Eye } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useTheme } from "@/lib/theme/context";
import { MUSHAF_SHORTCUTS } from "@/lib/quran/shortcuts";
import ModalShell from "@/components/ui/ModalShell";
import MushafButton from "./ui/MushafButton";
import MushafCloseButton from "./ui/MushafCloseButton";

type ReadingModeOption = "normal" | "sepia" | "green" | "purple" | "blue" | "red" | "pink" | "highContrast";
type MobileSection = "font" | "width" | "reading" | "preview" | "shortcuts";
type PaletteToken = { bg: string; fg: string; border: string; muted: string };

interface DisplaySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onResetToDefaults: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  pageWidth: "normal" | "wide" | "full";
  setPageWidth: (width: "normal" | "wide" | "full") => void;
  readingMode: ReadingModeOption;
  setReadingMode: (mode: ReadingModeOption) => void;
}

const READING_MODE_PALETTES: Record<ReadingModeOption, { light: PaletteToken; dark: PaletteToken }> = {
  normal: {
    light: { bg: "#faf9f5", fg: "#141413", border: "#d8d5cb", muted: "#e8e6dc" },
    dark: { bg: "#0b1120", fg: "#ece8e1", border: "#1e2a3e", muted: "#131d2e" },
  },
  sepia: {
    light: { bg: "#F5EFE0", fg: "#463318", border: "#DED1B6", muted: "#EBE0C5" },
    dark: { bg: "#1F1B16", fg: "#D6CDB8", border: "#3D362B", muted: "#362F26" },
  },
  green: {
    light: { bg: "#EAF4EC", fg: "#245A3F", border: "#BCD8C2", muted: "#D8EAD9" },
    dark: { bg: "#102117", fg: "#C2E9CD", border: "#2B5944", muted: "#204132" },
  },
  purple: {
    light: { bg: "#F5F1FA", fg: "#5A3E8A", border: "#CCBEE0", muted: "#E6DDF2" },
    dark: { bg: "#1B1527", fg: "#D0C2E7", border: "#4A3D64", muted: "#2F2741" },
  },
  blue: {
    light: { bg: "#EEF5FD", fg: "#1E4F8C", border: "#BDD0E8", muted: "#DBE7F5" },
    dark: { bg: "#132033", fg: "#B8D0EE", border: "#365178", muted: "#223857" },
  },
  red: {
    light: { bg: "#FAEFEF", fg: "#7A2A2A", border: "#DDB8B8", muted: "#F3D9D9" },
    dark: { bg: "#261515", fg: "#E8B3B3", border: "#644242", muted: "#472C2C" },
  },
  pink: {
    light: { bg: "#F9F0F4", fg: "#9A466F", border: "#D9B7C8", muted: "#F1DDE7" },
    dark: { bg: "#24161E", fg: "#E2B5C9", border: "#664456", muted: "#452A38" },
  },
  highContrast: {
    light: { bg: "#FFFFFF", fg: "#000000", border: "#000000", muted: "#E0E0E0" },
    dark: { bg: "#000000", fg: "#FFFFFF", border: "#FFFFFF", muted: "#111111" },
  },
};

const SHORTCUT_LABELS: Record<string, { ar: string; en: string }> = {
  "context-left": { ar: "التالي", en: "Next" },
  "context-right": { ar: "السابق", en: "Previous" },
  "force-page-nav": { ar: "الصفحات فقط", en: "Pages only" },
  "open-search": { ar: "بحث", en: "Search" },
  "toggle-range-panel": { ar: "لوحة المدى", en: "Range panel" },
  "focus-range": { ar: "تركيز المدى", en: "Focus range" },
  "toggle-audio": { ar: "تشغيل/إيقاف الصوت", en: "Audio toggle" },
  "close-active": { ar: "إغلاق", en: "Close" },
};

export default function DisplaySettings({
  isOpen,
  onClose,
  onResetToDefaults,
  fontSize,
  setFontSize,
  pageWidth,
  setPageWidth,
  readingMode,
  setReadingMode,
}: DisplaySettingsProps) {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [mobileSection, setMobileSection] = useState<MobileSection>("font");
  const isArabic = locale === "ar";

  const fontSizes = [
    { value: 24, label: isArabic ? "صغير" : "Small", preview: isArabic ? "أ ب" : "Aa" },
    { value: 32, label: isArabic ? "متوسط" : "Medium", preview: isArabic ? "أ ب" : "Aa" },
    { value: 40, label: isArabic ? "كبير" : "Large", preview: isArabic ? "أ ب" : "Aa" },
    { value: 48, label: isArabic ? "كبير جداً" : "Extra Large", preview: isArabic ? "أ ب" : "Aa" },
  ];

  const pageWidths = [
    { value: "normal" as const, label: t.mushaf.normal, sampleWidth: "w-9" },
    { value: "wide" as const, label: t.mushaf.wide, sampleWidth: "w-14" },
    { value: "full" as const, label: t.mushaf.fullWidth, sampleWidth: "w-20" },
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

  const paletteTone = theme === "dark" ? "dark" : "light";
  const previewPalette = READING_MODE_PALETTES[readingMode][paletteTone];
  const previewWidthClass = pageWidth === "normal" ? "max-w-[16rem]" : pageWidth === "wide" ? "max-w-[20rem]" : "max-w-full";
  const previewTextClass =
    fontSize === 24 ? "text-2xl" : fontSize === 32 ? "text-3xl" : fontSize === 40 ? "text-4xl" : "text-5xl";

  const shouldShow = (section: MobileSection) => mobileSection === section;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="display-settings-title"
      initialFocusRef={closeButtonRef}
      zIndex={70}
      backdropClassName="bg-black/50 backdrop-blur-sm"
      containerClassName="flex items-end sm:items-center justify-center p-0 sm:p-4"
      panelClassName="bg-card/95 backdrop-blur-xl border border-white/10 dark:border-white/5 sm:border-primary/10 rounded-t-3xl sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] overflow-hidden max-w-3xl w-full mx-auto max-h-[90vh] transition-all duration-500"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 bg-primary/5 backdrop-blur-xl sticky top-0 z-10 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60" />
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Settings size={20} className="animate-spin-slow" />
          </div>
          <div className="min-w-0">
            <h3 id="display-settings-title" className="font-bold text-lg leading-none text-primary font-['Amiri',serif] truncate">
              {t.mushaf.displaySettings}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1 font-semibold uppercase tracking-wider">
              {isArabic ? "العرض والقراءة والاختصارات" : "Display • Reading • Shortcuts"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <MushafButton
            variant="ghost"
            onClick={onResetToDefaults}
            className="h-10 px-3 text-xs font-bold bg-background/70 border border-border/40 hover:bg-primary/10"
            title={isArabic ? "إعادة الإعدادات الافتراضية" : "Reset to defaults"}
            aria-label={isArabic ? "إعادة الإعدادات الافتراضية" : "Reset to defaults"}
          >
            <RotateCcw size={14} />
            <span>{isArabic ? "إعادة ضبط" : "Reset"}</span>
          </MushafButton>
          <MushafCloseButton
            ref={closeButtonRef}
            onClick={onClose}
            iconSize={20}
            aria-label={t.common.close}
          />
        </div>
      </div>

      <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(90vh-82px)]" dir={isArabic ? "rtl" : "ltr"}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4">
          <div className="space-y-4">
            <section className="rounded-2xl border border-border/40 bg-gradient-to-b from-background/80 to-muted/20 p-4 shadow-sm">
              <button
                type="button"
                onClick={() => setMobileSection("font")}
                className="w-full flex items-center justify-between"
                aria-expanded={shouldShow("font")}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Type size={16} className="text-muted-foreground" />
                  {t.mushaf.fontSize}
                </span>
                <ChevronDown size={16} className={`sm:hidden text-muted-foreground transition-transform ${shouldShow("font") ? "rotate-180" : ""}`} />
              </button>
              <div className={`${shouldShow("font") ? "mt-3 block" : "hidden"} sm:block sm:mt-3`}>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t.mushaf.fontSize}>
                  {fontSizes.map((size) => {
                    const isActive = fontSize === size.value;
                    return (
                      <MushafButton
                        key={size.value}
                        variant={isActive ? "primary" : "ghost"}
                        onClick={() => setFontSize(size.value)}
                        aria-pressed={isActive}
                        aria-label={`${t.mushaf.fontSize} ${size.label}`}
                        className={`min-h-14 p-3 text-sm ${isActive ? "ring-2 ring-offset-1 ring-black/30 dark:ring-white/70 ring-offset-background" : "bg-background/80 border border-border/30 hover:border-primary/25"}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold">{size.label}</span>
                          <span className={`font-['Amiri',serif] ${size.value === 24 ? "text-base" : size.value === 32 ? "text-lg" : size.value === 40 ? "text-xl" : "text-2xl"}`}>
                            {size.preview}
                          </span>
                        </div>
                      </MushafButton>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/40 bg-gradient-to-b from-background/80 to-muted/20 p-4 shadow-sm">
              <button
                type="button"
                onClick={() => setMobileSection("width")}
                className="w-full flex items-center justify-between"
                aria-expanded={shouldShow("width")}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Monitor size={16} className="text-muted-foreground" />
                  {t.mushaf.pageWidth}
                </span>
                <ChevronDown size={16} className={`sm:hidden text-muted-foreground transition-transform ${shouldShow("width") ? "rotate-180" : ""}`} />
              </button>
              <div className={`${shouldShow("width") ? "mt-3 block" : "hidden"} sm:block sm:mt-3`}>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t.mushaf.pageWidth}>
                  {pageWidths.map((width) => {
                    const isActive = pageWidth === width.value;
                    return (
                      <MushafButton
                        key={width.value}
                        variant={isActive ? "primary" : "ghost"}
                        onClick={() => setPageWidth(width.value)}
                        aria-pressed={isActive}
                        aria-label={`${t.mushaf.pageWidth} ${width.label}`}
                        className={`min-h-14 p-3 text-sm ${isActive ? "ring-2 ring-offset-1 ring-black/30 dark:ring-white/70 ring-offset-background" : "bg-background/80 border border-border/30 hover:border-primary/25"}`}
                      >
                        <div className="flex flex-col items-center gap-1 w-full">
                          <span className="font-bold leading-none">{width.label}</span>
                          <span
                            aria-hidden="true"
                            className={`h-1.5 rounded-full bg-primary/40 ${width.sampleWidth}`}
                          />
                        </div>
                      </MushafButton>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/40 bg-gradient-to-b from-background/80 to-muted/20 p-4 shadow-sm">
              <button
                type="button"
                onClick={() => setMobileSection("reading")}
                className="w-full flex items-center justify-between"
                aria-expanded={shouldShow("reading")}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Palette size={16} className="text-muted-foreground" />
                  {t.mushaf.readingMode}
                </span>
                <ChevronDown size={16} className={`sm:hidden text-muted-foreground transition-transform ${shouldShow("reading") ? "rotate-180" : ""}`} />
              </button>
              <div className={`${shouldShow("reading") ? "mt-3 block" : "hidden"} sm:block sm:mt-3`}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label={t.mushaf.readingMode}>
                  {readingModes.map((mode) => {
                    const isActive = readingMode === mode.value;
                    const palette = READING_MODE_PALETTES[mode.value][paletteTone];
                    return (
                      <button
                        type="button"
                        key={mode.value}
                        onClick={() => setReadingMode(mode.value)}
                        aria-pressed={isActive}
                        aria-label={`${t.mushaf.readingMode} ${mode.label}`}
                        className={`min-h-14 rounded-xl border p-3 text-sm text-start transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${isActive ? "ring-2 ring-offset-1 ring-black/35 dark:ring-white/75 ring-offset-background shadow-[0_10px_24px_-12px_rgba(0,0,0,0.4)] scale-[1.01]" : "hover:brightness-[1.02] hover:shadow-sm"}`}
                        style={{
                          backgroundColor: palette.bg,
                          color: palette.fg,
                          borderColor: palette.border,
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold truncate">{mode.label}</span>
                          <span
                            aria-hidden="true"
                            className="w-4 h-4 rounded-full border border-black/15"
                            style={{ backgroundColor: palette.fg }}
                          />
                        </div>
                        <div
                          aria-hidden="true"
                          className="mt-2 h-1.5 rounded-full"
                          style={{ backgroundColor: palette.muted }}
                        >
                          <span
                            className="block h-1.5 rounded-full"
                            style={{ width: "42%", backgroundColor: palette.fg }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-2xl border border-border/40 bg-gradient-to-b from-background/80 to-muted/20 p-4 shadow-sm h-fit">
              <button
                type="button"
                onClick={() => setMobileSection("preview")}
                className="w-full flex items-center justify-between"
                aria-expanded={shouldShow("preview")}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Eye size={16} className="text-muted-foreground" />
                  {isArabic ? "معاينة مباشرة" : "Live Preview"}
                </span>
                <ChevronDown size={16} className={`sm:hidden text-muted-foreground transition-transform ${shouldShow("preview") ? "rotate-180" : ""}`} />
              </button>
              <div className={`${shouldShow("preview") ? "mt-3 block" : "hidden"} sm:block sm:mt-3`}>
                <div
                  className={`mx-auto w-full ${previewWidthClass} rounded-xl border p-4 transition-all duration-300`}
                  style={{
                    backgroundColor: previewPalette.bg,
                    borderColor: previewPalette.border,
                    color: previewPalette.fg,
                  }}
                >
                  <p className={`font-['Amiri',serif] text-center leading-[1.9] ${previewTextClass}`}>
                    {isArabic ? "إِنَّ مَعَ الْعُسْرِ يُسْرًا" : "Indeed, with hardship comes ease."}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/40 bg-gradient-to-b from-background/80 to-muted/20 p-4 shadow-sm h-fit">
              <button
                type="button"
                onClick={() => setMobileSection("shortcuts")}
                className="w-full flex items-center justify-between"
                aria-expanded={shouldShow("shortcuts")}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Keyboard size={16} className="text-muted-foreground" />
                  {t.mushaf.keyboardShortcuts}
                </span>
                <span className="hidden sm:inline text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                  {MUSHAF_SHORTCUTS.length}
                </span>
                <ChevronDown size={16} className={`sm:hidden text-muted-foreground transition-transform ${shouldShow("shortcuts") ? "rotate-180" : ""}`} />
              </button>
              <div className={`${shouldShow("shortcuts") ? "mt-3 block" : "hidden"} sm:block sm:mt-3`}>
                <div className="space-y-2.5">
                  {MUSHAF_SHORTCUTS.map((shortcut) => {
                    const shortLabel = SHORTCUT_LABELS[shortcut.id];
                    return (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/75 px-3 py-2.5 hover:border-primary/20 hover:bg-primary/5 transition-colors"
                      >
                        <span className="text-sm font-semibold text-foreground/90 leading-snug">
                          {shortLabel ? (isArabic ? shortLabel.ar : shortLabel.en) : (isArabic ? shortcut.descriptionAr : shortcut.descriptionEn)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {shortcut.keys.map((key) => (
                            <kbd key={`${shortcut.id}-${key}`}>{key}</kbd>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
