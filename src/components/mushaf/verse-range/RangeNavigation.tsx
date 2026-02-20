"use client";

import { ChevronLeft, ChevronRight, SkipForward, SkipBack, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import type { Chapter } from "@/lib/quran/api";
import { getNextRange, getPrevRange, getNextSurahStart, getPrevSurahStart } from "@/lib/quran/range-utils";

export interface RangeNavigationProps {
    chapterId: number;
    fromVerse: number;
    toVerse: number;
    chapters: Chapter[];
    onNavigate: (chapterId: number, from: number, to: number) => void;
}

export function RangeNavigation({
    chapterId,
    fromVerse,
    toVerse,
    chapters,
    onNavigate,
}: RangeNavigationProps) {
    const { locale } = useI18n();

    const currentChapter = chapters.find(c => c.id === chapterId);

    const handleNextRange = () => {
        const next = getNextRange(chapterId, fromVerse, toVerse, chapters);
        if (next) {
            onNavigate(next.chapterId, next.from, next.to);
        }
    };

    const handlePrevRange = () => {
        const prev = getPrevRange(chapterId, fromVerse, toVerse, chapters);
        if (prev) {
            onNavigate(prev.chapterId, prev.from, prev.to);
        }
    };

    const handleNextSurah = () => {
        const next = getNextSurahStart(chapterId, chapters);
        if (next) {
            onNavigate(next.chapterId, next.from, next.to);
        }
    };

    const handlePrevSurah = () => {
        const prev = getPrevSurahStart(chapterId, chapters);
        if (prev) {
            onNavigate(prev.chapterId, prev.from, prev.to);
        }
    };

    const handleExtend = (amount: number) => {
        if (!currentChapter) return;
        const newTo = Math.min(toVerse + amount, currentChapter.verses_count);
        onNavigate(chapterId, fromVerse, newTo);
    };

    const rangeSize = toVerse - fromVerse + 1;

    return (
        <div className="space-y-3">
            {/* Range Navigation */}
            <div className="flex items-center justify-between gap-2">
                <button
                    onClick={handlePrevRange}
                    className="flex items-center gap-1 px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                    {locale === "ar" ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    {locale === "ar" ? "المدى السابق" : "Prev Range"}
                </button>
                <span className="text-xs text-muted-foreground">
                    {rangeSize} {locale === "ar" ? "آيات" : "verses"}
                </span>
                <button
                    onClick={handleNextRange}
                    className="flex items-center gap-1 px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                    {locale === "ar" ? "المدى التالي" : "Next Range"}
                    {locale === "ar" ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>
            </div>

            {/* Surah Navigation */}
            <div className="flex items-center justify-between gap-2">
                <button
                    onClick={handlePrevSurah}
                    className="flex items-center gap-1 px-3 py-2 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors border border-primary/30"
                >
                    {locale === "ar" ? <SkipForward size={14} /> : <SkipBack size={14} />}
                    {locale === "ar" ? "السورة السابقة" : "Prev Surah"}
                </button>
                <button
                    onClick={handleNextSurah}
                    className="flex items-center gap-1 px-3 py-2 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors border border-primary/30"
                >
                    {locale === "ar" ? "السورة التالية" : "Next Surah"}
                    {locale === "ar" ? <SkipBack size={14} /> : <SkipForward size={14} />}
                </button>
            </div>

            {/* Extend Range */}
            <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">
                    {locale === "ar" ? "توسيع المدى:" : "Extend:"}
                </span>
                {[5, 10, 20].map((amount) => (
                    <motion.button
                        key={amount}
                        onClick={() => handleExtend(amount)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    >
                        <Plus size={12} />
                        {amount}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
