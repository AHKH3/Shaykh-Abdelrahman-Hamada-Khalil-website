"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Brain, Lightbulb, Type, AlignLeft, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { Verse } from "@/lib/quran/api";
import { getFirstLetter, getFirstWord } from "@/lib/quran/range-utils";

export type HintMode = "none" | "firstLetter" | "firstWord" | "full";

export interface MemorizationModeProps {
    verses: Verse[];
    currentVerseKey: string | null;
}

export function MemorizationMode({
    verses,
    currentVerseKey,
}: MemorizationModeProps) {
    const { locale } = useI18n();
    const [isEnabled, setIsEnabled] = useState(false);
    const [hiddenVerses, setHiddenVerses] = useState<Set<string>>(new Set());
    const [hintMode, setHintMode] = useState<HintMode>("firstLetter");
    const [revealedVerses, setRevealedVerses] = useState<Set<string>>(new Set());

    // Reset when verses change
    useEffect(() => {
        setHiddenVerses(new Set());
        setRevealedVerses(new Set());
    }, [verses]);

    const hideAll = () => {
        setHiddenVerses(new Set(verses.map(v => v.verse_key)));
        setRevealedVerses(new Set());
    };

    const showAll = () => {
        setHiddenVerses(new Set());
        setRevealedVerses(new Set());
    };

    const toggleVerse = (verseKey: string) => {
        if (revealedVerses.has(verseKey)) {
            setRevealedVerses(prev => {
                const next = new Set(prev);
                next.delete(verseKey);
                return next;
            });
        } else {
            setRevealedVerses(prev => new Set(prev).add(verseKey));
        }
    };

    const getVerseDisplay = (verse: Verse) => {
        const isHidden = hiddenVerses.has(verse.verse_key);
        const isRevealed = revealedVerses.has(verse.verse_key);

        if (!isHidden || isRevealed) {
            return verse.text_uthmani;
        }

        // Show hint based on mode
        switch (hintMode) {
            case "firstLetter":
                return getFirstLetter(verse.text_uthmani) + " ".repeat(verse.text_uthmani.length - 1);
            case "firstWord":
                return getFirstWord(verse.text_uthmani) + " ...";
            case "none":
                return "•".repeat(verse.text_uthmani.length / 2);
            default:
                return verse.text_uthmani;
        }
    };

    const hintModes: { value: HintMode; labelAr: string; labelEn: string; icon: React.ReactNode }[] = [
        { value: "none", labelAr: "بدون تلميح", labelEn: "No hint", icon: <EyeOff size={14} /> },
        { value: "firstLetter", labelAr: "الحرف الأول", labelEn: "First letter", icon: <Type size={14} /> },
        { value: "firstWord", labelAr: "الكلمة الأولى", labelEn: "First word", icon: <AlignLeft size={14} /> },
    ];

    return (
        <div className="space-y-3">
            {/* Header - Classroom Mode */}
            <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Users size={16} className="text-primary" />
                <span className="text-sm font-medium">
                    {locale === "ar" ? "وضع الفصل الدراسي" : "Classroom Mode"}
                </span>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain size={16} className="text-primary" />
                    <span className="text-sm font-medium">
                        {locale === "ar" ? "إخفاء الآيات" : "Hide Verses"}
                    </span>
                </div>
                <button
                    onClick={() => setIsEnabled(!isEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${isEnabled ? "bg-primary" : "bg-muted"
                        }`}
                >
                    <motion.div
                        initial={false}
                        animate={{ x: isEnabled ? 20 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                    />
                </button>
            </div>

            {/* Controls */}
            <AnimatePresence>
                {isEnabled && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-3 overflow-hidden"
                    >
                        {/* Show/Hide All */}
                        <div className="flex gap-2">
                            <button
                                onClick={showAll}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                            >
                                <Eye size={14} />
                                {locale === "ar" ? "إظهار الكل" : "Show All"}
                            </button>
                            <button
                                onClick={hideAll}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                            >
                                <EyeOff size={14} />
                                {locale === "ar" ? "إخفاء الكل" : "Hide All"}
                            </button>
                        </div>

                        {/* Hint Mode */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Lightbulb size={12} />
                                {locale === "ar" ? "وضع التلميح" : "Hint Mode"}
                            </label>
                            <div className="flex gap-2">
                                {hintModes.map((mode) => (
                                    <button
                                        key={mode.value}
                                        onClick={() => setHintMode(mode.value)}
                                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${hintMode === mode.value
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-muted hover:bg-muted/80 border-border"
                                            }`}
                                    >
                                        {mode.icon}
                                        <span>{locale === "ar" ? mode.labelAr : mode.labelEn}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="text-muted-foreground">
                                    {locale === "ar" ? "الآيات المُتَمَّ حفظها" : "Verses Recited"}
                                </span>
                                <span className="font-medium">
                                    {revealedVerses.size} / {hiddenVerses.size || verses.length}
                                </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${(revealedVerses.size / (hiddenVerses.size || verses.length)) * 100}%`,
                                    }}
                                    className="h-full bg-primary rounded-full"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2">
                                {locale === "ar"
                                    ? "انقر على الآيات المخفية لإظهارها"
                                    : "Click on hidden verses to reveal them"}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Component to render verse with memorization mode
export function MemorizationVerse({
    verse,
    isHidden,
    isRevealed,
    hintMode,
    isCurrentAudio,
    onClick,
}: {
    verse: Verse;
    isHidden: boolean;
    isRevealed: boolean;
    hintMode: HintMode;
    isCurrentAudio: boolean;
    onClick: () => void;
}) {
    const getVerseDisplay = () => {
        if (!isHidden || isRevealed) {
            return verse.text_uthmani;
        }

        switch (hintMode) {
            case "firstLetter":
                const firstLetter = getFirstLetter(verse.text_uthmani);
                return firstLetter + " ".repeat(Math.max(0, verse.text_uthmani.length - 1));
            case "firstWord":
                return getFirstWord(verse.text_uthmani) + " ...";
            case "none":
                return "•".repeat(Math.floor(verse.text_uthmani.length / 2));
            default:
                return verse.text_uthmani;
        }
    };

    return (
        <span
            onClick={onClick}
            className={`cursor-pointer transition-all inline ${isCurrentAudio ? "verse-highlight" : ""
                } ${isHidden && !isRevealed ? "opacity-70" : ""}`}
        >
            {getVerseDisplay()}{" "}
            <span className="inline-flex items-center justify-center text-muted-foreground font-sans mx-1 min-w-[1.5rem]">
                ۝{verse.verse_number.toLocaleString("ar-EG")}
            </span>{" "}
        </span>
    );
}
