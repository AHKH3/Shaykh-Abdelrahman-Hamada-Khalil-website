"use client";

import { Clock, FileText, BookOpen, Layers, Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { Chapter, Verse } from "@/lib/quran/api";
import { getCurrentJuz, getCurrentHizb, getTodaySession, getLastViewedVerses } from "@/lib/quran/range-utils";
import { motion } from "framer-motion";

interface QuickPresetsProps {
  chapters: Chapter[];
  currentPage: number;
  currentVerses: Verse[];
  onSelectPreset: (chapterId: number, from: number, to: number) => void;
}

export function QuickPresets({
  chapters,
  currentPage,
  currentVerses,
  onSelectPreset,
}: QuickPresetsProps) {
  const { locale } = useI18n();

  // Get current context
  const currentJuz = getCurrentJuz(currentVerses);
  const currentHizb = getCurrentHizb(currentVerses);
  const currentChapter = currentVerses.length > 0 
    ? chapters.find(c => c.id === currentVerses[0].chapter_id)
    : null;
  const todaySession = getTodaySession();
  const lastViewed = getLastViewedVerses();

  // Handle preset clicks
  const handleLast5Verses = () => {
    if (lastViewed.length > 0) {
      const last = lastViewed[0];
      const from = Math.max(1, last.verseNumber - 4);
      onSelectPreset(last.chapterId, from, last.verseNumber);
    } else if (currentChapter) {
      // Default to last 5 of current chapter
      const from = Math.max(1, currentChapter.verses_count - 4);
      onSelectPreset(currentChapter.id, from, currentChapter.verses_count);
    }
  };

  const handleCurrentPage = () => {
    if (currentVerses.length > 0) {
      const firstVerse = currentVerses[0];
      const lastVerse = currentVerses[currentVerses.length - 1];
      onSelectPreset(firstVerse.chapter_id, firstVerse.verse_number, lastVerse.verse_number);
    }
  };

  const handleCurrentJuz = () => {
    if (currentJuz && currentVerses.length > 0) {
      // Get all verses in the current juz - we need to find the range
      // For simplicity, we'll use the current chapter and estimate
      const chapter = currentChapter;
      if (chapter) {
        // This is a simplified version - in production, you'd calculate the actual juz range
        onSelectPreset(chapter.id, 1, chapter.verses_count);
      }
    }
  };

  const handleCurrentHizb = () => {
    if (currentHizb && currentChapter) {
      // Simplified - select a portion of the current chapter
      const quarter = Math.floor(currentChapter.verses_count / 4);
      onSelectPreset(currentChapter.id, 1, Math.min(quarter * 2, currentChapter.verses_count));
    }
  };

  const handleTodaySession = () => {
    if (todaySession) {
      onSelectPreset(todaySession.chapterId, todaySession.fromVerse, todaySession.toVerse);
    }
  };

  const presets = [
    {
      id: "last5",
      labelAr: "آخر 5 آيات",
      labelEn: "Last 5 Verses",
      icon: Clock,
      onClick: handleLast5Verses,
      disabled: !currentChapter && lastViewed.length === 0,
    },
    {
      id: "currentPage",
      labelAr: "الصفحة الحالية",
      labelEn: "Current Page",
      icon: FileText,
      onClick: handleCurrentPage,
      disabled: currentVerses.length === 0,
    },
    {
      id: "currentJuz",
      labelAr: "الجزء الحالي",
      labelEn: "Current Juz",
      icon: BookOpen,
      onClick: handleCurrentJuz,
      disabled: !currentJuz,
    },
    {
      id: "currentHizb",
      labelAr: "الحزب الحالي",
      labelEn: "Current Hizb",
      icon: Layers,
      onClick: handleCurrentHizb,
      disabled: !currentHizb,
    },
    {
      id: "todaySession",
      labelAr: "جلسة اليوم",
      labelEn: "Today's Session",
      icon: Calendar,
      onClick: handleTodaySession,
      disabled: !todaySession,
    },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {locale === "ar" ? "مداخل سريعة" : "Quick Presets"}
      </label>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const Icon = preset.icon;
          return (
            <motion.button
              key={preset.id}
              onClick={preset.onClick}
              disabled={preset.disabled}
              whileHover={{ scale: preset.disabled ? 1 : 1.02 }}
              whileTap={{ scale: preset.disabled ? 1 : 0.98 }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${
                preset.disabled
                  ? "opacity-50 cursor-not-allowed bg-muted/50 border-border"
                  : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
              }`}
            >
              <Icon size={14} />
              <span>{locale === "ar" ? preset.labelAr : preset.labelEn}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
