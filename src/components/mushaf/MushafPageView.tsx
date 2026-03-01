"use client";

import { memo, type MouseEvent as ReactMouseEvent } from "react";
import type { Chapter, Verse } from "@/lib/quran/api";
import MushafPageFrame from "./MushafPageFrame";

interface MushafPageViewProps {
  pageNumber: number;
  fontSizeClass: string;
  chapters: Chapter[];
  locale: string;
  juzLabel: string;
  endOfMushafLabel: string;
  verses: Verse[];
  currentAudioVerse: string | null;
  highlightedVerse: string | null;
  onVerseClick: (verseKey: string) => void;
  onVerseNumberClick: (verse: Verse, event: ReactMouseEvent) => void;
}

function groupVersesBySurah(verses: Verse[], chapters: Chapter[]) {
  const grouped: Array<{ chapterId: number; chapterName: string; verses: Verse[] }> = [];

  verses.forEach((verse) => {
    const last = grouped[grouped.length - 1];
    if (last && last.chapterId === verse.chapter_id) {
      last.verses.push(verse);
      return;
    }

    const chapter = chapters.find((c) => c.id === verse.chapter_id);
    grouped.push({
      chapterId: verse.chapter_id,
      chapterName: chapter?.name_arabic || `سورة ${verse.chapter_id}`,
      verses: [verse],
    });
  });

  return grouped;
}

function MushafPageViewComponent({
  pageNumber,
  fontSizeClass,
  chapters,
  locale,
  juzLabel,
  endOfMushafLabel,
  verses,
  currentAudioVerse,
  highlightedVerse,
  onVerseClick,
  onVerseNumberClick,
}: MushafPageViewProps) {
  const groupedVerses = groupVersesBySurah(verses, chapters);
  const juz = verses[0]?.juz_number;

  const renderVerse = (verse: Verse) => (
    <span
      key={verse.verse_key}
      data-verse-key={verse.verse_key}
      className={`cursor-pointer transition-all duration-500 ease-out inline relative px-1 py-0.5 rounded-lg ${currentAudioVerse === verse.verse_key
        ? "bg-primary/10 text-primary ring-1 ring-primary/30 shadow-[0_0_15px_rgba(var(--color-primary),0.15)] z-10"
        : highlightedVerse === verse.verse_key
          ? "bg-primary/5 ring-1 ring-primary/20 shadow-[0_0_10px_rgba(var(--color-primary),0.1)] z-10"
          : "hover:bg-black/5 dark:hover:bg-white/5"
        }`}
      onClick={() => onVerseClick(verse.verse_key)}
    >
      <span className={currentAudioVerse === verse.verse_key ? "drop-shadow-sm" : ""}>{verse.text_uthmani}</span>{" "}
      <span
        className="inline-flex items-center justify-center font-sans mx-1.5 transition-all duration-300 hover:scale-110 hover:text-amber-500 dark:hover:text-amber-400 text-primary/60 hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] cursor-pointer select-none"
        onClick={(event) => onVerseNumberClick(verse, event)}
      >
        ۝{verse.verse_number.toLocaleString("ar-EG")}
      </span>{" "}
    </span>
  );

  return (
    <div className="mushaf-page-view w-full mx-auto max-w-[820px]">
      {verses.length === 0 ? (
        <div className="rounded-3xl border border-border/40 p-6 sm:p-8 bg-card shadow-[0_10px_50px_-15px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center min-h-[360px] text-muted-foreground text-center gap-2">
          <p className="text-sm italic">{endOfMushafLabel}</p>
          <p className="text-xs opacity-70">
            {locale === "ar" ? "لم يتم تحميل محتوى الصفحة بعد" : "Page content is not loaded yet"}
          </p>
        </div>
      ) : (
        <MushafPageFrame
          locale={locale}
          juzLabel={juzLabel}
          juz={juz}
          pageNumber={pageNumber}
          fontSizeClass={fontSizeClass}
          isRangeMode={false}
        >
          <div className={`quran-text text-center leading-[2.8] ${fontSizeClass}`} dir="rtl">
            {groupedVerses.map((group, groupIndex) => (
              <div key={`${pageNumber}-${groupIndex}`}>
                {group.verses[0].verse_number === 1 && (
                  <div className="my-10 text-center">
                    <div className="inline-block px-14 py-4 bg-primary/5 rounded-2xl border border-primary/10 shadow-inner">
                      <h3 className="text-2xl font-bold font-['Amiri',serif] text-foreground whitespace-nowrap">{group.chapterName}</h3>
                    </div>
                    {group.chapterId !== 9 && group.chapterId !== 1 && (
                      <p className="mt-6 text-2xl font-['Amiri',serif] text-muted-foreground/80">
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                      </p>
                    )}
                  </div>
                )}

                {group.verses.map(renderVerse)}
              </div>
            ))}
          </div>
        </MushafPageFrame>
      )}
    </div>
  );
}

const MushafPageView = memo(MushafPageViewComponent);

export default MushafPageView;
