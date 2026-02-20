"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle, Circle, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { Verse } from "@/lib/quran/api";
import { formatTime } from "@/lib/quran/range-utils";

export interface RangeProgressProps {
    verses: Verse[];
    currentVerseKey: string | null;
    onVerseClick: (verseKey: string) => void;
}

const MEMORIZED_KEY = "memorized_verses";

export function RangeProgress({
    verses,
    currentVerseKey,
    onVerseClick,
}: RangeProgressProps) {
    const { locale } = useI18n();
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [memorizedVerses, setMemorizedVerses] = useState<Set<string>>(new Set());

    // Load memorized verses from localStorage
    useEffect(() => {
        try {
            const data = localStorage.getItem(MEMORIZED_KEY);
            if (data) {
                setMemorizedVerses(new Set(JSON.parse(data)));
            }
        } catch (error) {
            console.error("Failed to load memorized verses:", error);
        }
    }, []);

    // Session timer
    useEffect(() => {
        const interval = setInterval(() => {
            setSessionSeconds((s) => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Save memorized verses to localStorage
    const saveMemorized = useCallback((verses: Set<string>) => {
        try {
            localStorage.setItem(MEMORIZED_KEY, JSON.stringify([...verses]));
        } catch (error) {
            console.error("Failed to save memorized verses:", error);
        }
    }, []);

    const toggleMemorized = (verseKey: string) => {
        setMemorizedVerses((prev) => {
            const next = new Set(prev);
            if (next.has(verseKey)) {
                next.delete(verseKey);
            } else {
                next.add(verseKey);
            }
            saveMemorized(next);
            return next;
        });
    };

    // Calculate progress
    const currentIndex = verses.findIndex((v) => v.verse_key === currentVerseKey);
    const progress = verses.length > 0 ? ((currentIndex + 1) / verses.length) * 100 : 0;
    const memorizedCount = verses.filter((v) => memorizedVerses.has(v.verse_key)).length;

    return (
        <div className="space-y-3">
            {/* Progress Bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                        {locale === "ar" ? "التقدم" : "Progress"}
                    </span>
                    <span className="font-medium">
                        {locale === "ar" ? "الآية" : "Verse"} {currentIndex + 1} {locale === "ar" ? "من" : "of"} {verses.length}
                    </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-primary rounded-full"
                    />
                </div>
            </div>

            {/* Session Timer & Memorized Count */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={14} />
                    <span>{formatTime(sessionSeconds)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>
                        {memorizedCount} / {verses.length} {locale === "ar" ? "محفوظة" : "memorized"}
                    </span>
                </div>
            </div>

            {/* Verse Navigation */}
            <div className="flex items-center justify-center gap-2">
                <button
                    onClick={() => {
                        if (currentIndex > 0) {
                            onVerseClick(verses[currentIndex - 1].verse_key);
                        }
                    }}
                    disabled={currentIndex <= 0}
                    className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                >
                    {locale === "ar" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
                <span className="text-sm font-medium px-3 py-1 bg-muted rounded-lg min-w-[80px] text-center">
                    {currentIndex + 1} / {verses.length}
                </span>
                <button
                    onClick={() => {
                        if (currentIndex < verses.length - 1) {
                            onVerseClick(verses[currentIndex + 1].verse_key);
                        }
                    }}
                    disabled={currentIndex >= verses.length - 1}
                    className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                >
                    {locale === "ar" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
            </div>

            {/* Verse Indicators */}
            <div className="flex flex-wrap justify-center gap-1">
                {verses.map((verse, idx) => {
                    const isCurrent = verse.verse_key === currentVerseKey;
                    const isMemorized = memorizedVerses.has(verse.verse_key);

                    return (
                        <button
                            key={verse.verse_key}
                            onClick={() => onVerseClick(verse.verse_key)}
                            onDoubleClick={() => toggleMemorized(verse.verse_key)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${isCurrent
                                    ? "bg-primary text-primary-foreground scale-110"
                                    : isMemorized
                                        ? "bg-green-500/20 text-green-600 border border-green-500/30"
                                        : "bg-muted hover:bg-muted/80"
                                }`}
                            title={`${verse.verse_key}${isMemorized ? " (محفوظة)" : ""}`}
                        >
                            {isMemorized ? (
                                <CheckCircle size={12} />
                            ) : (
                                verse.verse_number
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
