"use client";

import { motion } from "framer-motion";
import { Lightbulb, MapPin, Clock, Star, BookOpen, Sun, Moon, FileText } from "lucide-react";
import type { Chapter } from "@/lib/quran/api";
import { getSmartSuggestions, type SmartSuggestion } from "@/lib/quran/range-utils";
import { useI18n } from "@/lib/i18n/context";

interface SmartSuggestionsProps {
    chapters: Chapter[];
    currentPage: number;
    currentChapterId?: number;
    currentVerseNumber?: number;
    verses: any[];
    onSelectSuggestion: (chapterId: number, from: number, to: number) => void;
}

export function SmartSuggestions({
    chapters,
    currentPage,
    currentChapterId,
    currentVerseNumber,
    verses,
    onSelectSuggestion,
}: SmartSuggestionsProps) {
    const { t, locale } = useI18n();

    const suggestions = getSmartSuggestions(
        {
            currentPage,
            currentChapterId,
            currentVerseNumber,
            chapters,
            verses,
        },
        chapters
    );

    const getIcon = (suggestion: SmartSuggestion) => {
        switch (suggestion.type) {
            case "position":
                return <MapPin size={16} className="text-blue-500" />;
            case "history":
                return <Clock size={16} className="text-amber-500" />;
            case "time":
                return suggestion.labelAr.includes("الصباح") || suggestion.labelEn.includes("Morning")
                    ? <Sun size={16} className="text-orange-500" />
                    : <Moon size={16} className="text-indigo-500" />;
            case "favorite":
                return <Star size={16} className="text-yellow-500" />;
            case "bookmark":
                return <BookOpen size={16} className="text-emerald-500" />;
            default:
                return <Lightbulb size={16} className="text-primary" />;
        }
    };

    if (suggestions.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground text-sm">
                {locale === "ar" ? "لا توجد اقتراحات حالياً" : "No suggestions available"}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-primary" />
                <span className="text-sm font-medium">{t.mushaf.suggestedForYou}</span>
            </div>

            <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                    <motion.button
                        key={suggestion.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onSelectSuggestion(suggestion.chapterId, suggestion.fromVerse, suggestion.toVerse)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors text-right"
                        dir={locale === "ar" ? "rtl" : "ltr"}
                    >
                        <span className="flex-shrink-0">{getIcon(suggestion)}</span>
                        <span className="flex-1 text-sm text-left">
                            {locale === "ar" ? suggestion.labelAr : suggestion.labelEn}
                        </span>
                        <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
