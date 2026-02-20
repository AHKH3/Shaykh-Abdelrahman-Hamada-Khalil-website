"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { BookOpen } from "lucide-react";
import FloatingPanel from "./FloatingPanel";
import { VerseRangeForm } from "./QuickVerseRangePanel";
import type { Chapter, Verse } from "@/lib/quran/api";
import { useI18n } from "@/lib/i18n/context";
import { toArabicNumber } from "@/lib/quran/range-utils";

interface FloatingVerseRangePanelProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  onSelectRange: (chapterId: number, from: number, to: number) => void;
  initialChapterId?: number;
  initialFromVerse?: number;
  initialToVerse?: number;
  // New props for advanced features
  currentVerses?: Verse[];
  currentPage?: number;
  currentAudioVerse?: string | null;
  isPlaying?: boolean;
  onPlayVerse?: (verseKey: string) => void;
  onPauseAudio?: () => void;
  onResumeAudio?: () => void;
  // Range data for collapsed state
  rangeData?: {
    chapterId: number;
    fromVerse: number;
    toVerse: number;
    verses: Verse[];
    chapterInfo?: Chapter;
  } | null;
  // Active mode
  activeMode?: "memorization" | "progress" | "range";
  // Phase 3 props
  currentVerse?: Verse | null;
  onTogglePanel?: () => void;
}

// Auto-collapse delay options
const AUTO_COLLAPSE_OPTIONS = [
  { value: 0, labelAr: "معطل", labelEn: "Disabled" },
  { value: 5, labelAr: "٥ ثوانٍ", labelEn: "5 seconds" },
  { value: 10, labelAr: "١٠ ثوانٍ", labelEn: "10 seconds" },
  { value: 30, labelAr: "٣٠ ثانية", labelEn: "30 seconds" },
];

export default function FloatingVerseRangePanel({
  isOpen,
  onClose,
  chapters,
  onSelectRange,
  initialChapterId,
  initialFromVerse,
  initialToVerse,
  currentVerses = [],
  currentPage = 1,
  currentAudioVerse = null,
  isPlaying = false,
  onPlayVerse,
  onPauseAudio,
  onResumeAudio,
  rangeData,
  activeMode = "range",
  currentVerse = null,
  onTogglePanel,
}: FloatingVerseRangePanelProps) {
  const { locale } = useI18n();
  const [autoCollapseDelay, setAutoCollapseDelay] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  // Load auto-collapse preference
  useEffect(() => {
    const saved = localStorage.getItem("verse-range-auto-collapse");
    if (saved) {
      setAutoCollapseDelay(parseInt(saved) || 0);
    }
  }, []);

  // Save auto-collapse preference
  const updateAutoCollapseDelay = useCallback((value: number) => {
    setAutoCollapseDelay(value);
    localStorage.setItem("verse-range-auto-collapse", String(value));
  }, []);

  // Calculate collapsed info
  const collapsedInfo = useMemo(() => {
    if (!rangeData) return undefined;

    const chapter = rangeData.chapterInfo || chapters.find(c => c.id === rangeData.chapterId);
    const verseCount = rangeData.toVerse - rangeData.fromVerse + 1;

    // Format range reference
    let rangeReference = "";
    if (chapter) {
      if (locale === "ar") {
        rangeReference = `${chapter.name_arabic}: ${toArabicNumber(rangeData.fromVerse)}-${toArabicNumber(rangeData.toVerse)}`;
      } else {
        rangeReference = `${chapter.name_simple}: ${rangeData.fromVerse}-${rangeData.toVerse}`;
      }
    }

    // Calculate progress based on current audio verse
    let progress = undefined;
    if (currentAudioVerse && currentVerses.length > 0) {
      const currentIndex = currentVerses.findIndex(v => v.verse_key === currentAudioVerse);
      if (currentIndex >= 0) {
        progress = Math.round(((currentIndex + 1) / currentVerses.length) * 100);
      }
    }

    return {
      rangeReference,
      progress,
      mode: activeMode,
      isPlaying,
      verseCount,
    };
  }, [rangeData, chapters, locale, currentAudioVerse, currentVerses, isPlaying, activeMode]);

  return (
    <FloatingPanel
      id="verse-range"
      title={locale === "ar" ? "مدى الآيات" : "Verse Range"}
      icon={<BookOpen size={16} />}
      isOpen={isOpen}
      onClose={onClose}
      minWidth={360}
      defaultPanelHeight={520}
      zIndex={60}
      collapsedInfo={collapsedInfo}
      autoCollapseDelay={autoCollapseDelay}
      onExpandChange={setIsExpanded}
    >
      <VerseRangeForm
        chapters={chapters}
        onSelectRange={onSelectRange}
        onClose={onClose}
        initialChapterId={initialChapterId}
        initialFromVerse={initialFromVerse}
        initialToVerse={initialToVerse}
        currentVerses={currentVerses}
        currentPage={currentPage}
        currentAudioVerse={currentAudioVerse}
        isPlaying={isPlaying}
        onPlayVerse={onPlayVerse}
        onPauseAudio={onPauseAudio}
        onResumeAudio={onResumeAudio}
        autoCollapseDelay={autoCollapseDelay}
        onAutoCollapseDelayChange={updateAutoCollapseDelay}
        isExpanded={isExpanded}
        currentVerse={currentVerse}
        onTogglePanel={onTogglePanel}
      />
    </FloatingPanel>
  );
}

// Export the auto collapse options for use in the form
export { AUTO_COLLAPSE_OPTIONS };
