"use client";

import { BookOpen } from "lucide-react";
import FloatingPanel from "./FloatingPanel";
import { VerseRangeForm } from "./QuickVerseRangePanel";
import type { Chapter } from "@/lib/quran/api";
import { useI18n } from "@/lib/i18n/context";

interface FloatingVerseRangePanelProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  onSelectRange: (chapterId: number, from: number, to: number) => void;
}

export default function FloatingVerseRangePanel({
  isOpen,
  onClose,
  chapters,
  onSelectRange,
}: FloatingVerseRangePanelProps) {
  const { locale } = useI18n();

  return (
    <FloatingPanel
      id="verse-range"
      title={locale === "ar" ? "مدى الآيات" : "Verse Range"}
      icon={<BookOpen size={16} />}
      isOpen={isOpen}
      onClose={onClose}
      minWidth={320}
      defaultPanelHeight={420}
      zIndex={45}
    >
      <VerseRangeForm
        chapters={chapters}
        onSelectRange={onSelectRange}
      />
    </FloatingPanel>
  );
}
