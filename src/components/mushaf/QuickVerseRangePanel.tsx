"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Plus, Minus, BookOpen, History } from "lucide-react";
import type { Chapter } from "@/lib/quran/api";
import { validateVerseRange } from "@/lib/quran/api";
import { useI18n } from "@/lib/i18n/context";
import { motion, AnimatePresence } from "framer-motion";
import { saveRangeToHistory } from "@/lib/quran/range-utils";
import { RangeHistory } from "./verse-range/RangeHistory";
import MushafButton from "./ui/MushafButton";
import ModalShell from "@/components/ui/ModalShell";
import MushafCloseButton from "./ui/MushafCloseButton";

interface VerseRangeFormProps {
  chapters: Chapter[];
  onSelectRange: (chapterId: number, from: number, to: number) => void;
  onClose?: () => void;
  initialChapterId?: number;
  initialFromVerse?: number;
  initialToVerse?: number;
}

const RECENT_SURAHS_KEY = "quran-recent-surahs";
const LAST_SESSION_KEY = "quran-last-session";

function safeGetStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorageItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // No-op: keep feature working when storage is restricted.
  }
}

export function VerseRangeForm({
  chapters,
  onSelectRange,
  initialChapterId,
  initialFromVerse,
  initialToVerse,
}: VerseRangeFormProps) {
  const { t, locale } = useI18n();

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(
    () => (initialChapterId ? chapters.find((item) => item.id === initialChapterId) || null : null)
  );
  const [fromVerse, setFromVerse] = useState(initialFromVerse?.toString() || "");
  const [toVerse, setToVerse] = useState(initialToVerse?.toString() || "");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentSurahs, setRecentSurahs] = useState<number[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastAppliedRef = useRef<{ chapterId: number; from: number; to: number } | null>(null);
  const isRtl = locale === "ar";

  useEffect(() => {
    const stored = safeGetStorageItem(RECENT_SURAHS_KEY);
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecentSurahs(JSON.parse(stored));
      } catch {
        // ignore
      }
    }

    if (initialChapterId) {
      const chapter = chapters.find((item) => item.id === initialChapterId);
      if (!chapter) return;
      setSelectedChapter(chapter);
      setFromVerse(initialFromVerse?.toString() || "1");
      setToVerse(initialToVerse?.toString() || chapter.verses_count.toString());
      return;
    }

    const storedSession = safeGetStorageItem(LAST_SESSION_KEY);
    if (!storedSession) return;

    try {
      const parsed = JSON.parse(storedSession);
      const chapter = chapters.find((item) => item.id === parsed.chapterId);
      if (!chapter) return;
      setSelectedChapter(chapter);
      setFromVerse(parsed.from.toString());
      setToVerse(parsed.to.toString());
    } catch {
      // ignore
    }
  }, [initialChapterId, initialFromVerse, initialToVerse, chapters]);

  useEffect(() => {
    if (!selectedChapter || !fromVerse || !toVerse) return;

    const from = Number(fromVerse);
    const to = Number(toVerse);

    if (!Number.isInteger(from) || !Number.isInteger(to)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(locale === "ar" ? "يرجى إدخال أرقام صحيحة" : "Please enter valid numbers");
      return;
    }

    const validation = validateVerseRange(selectedChapter.id, from, to, chapters);
    if (!validation.valid) {
      setError(locale === "ar" ? validation.error || t.mushaf.invalidRange : validation.errorEn || t.mushaf.invalidRange);
      return;
    }

    const lastApplied = lastAppliedRef.current;
    if (
      lastApplied &&
      lastApplied.chapterId === selectedChapter.id &&
      lastApplied.from === from &&
      lastApplied.to === to
    ) {
      return;
    }

    lastAppliedRef.current = { chapterId: selectedChapter.id, from, to };
    setError("");
    onSelectRange(selectedChapter.id, from, to);

    safeSetStorageItem(
      LAST_SESSION_KEY,
      JSON.stringify({
        chapterId: selectedChapter.id,
        from,
        to,
        timestamp: Date.now(),
      })
    );

    saveRangeToHistory(selectedChapter.id, selectedChapter.name_arabic, from, to);

    setRecentSurahs((prev) => {
      if (prev[0] === selectedChapter.id) return prev;
      const next = [selectedChapter.id, ...prev.filter((id) => id !== selectedChapter.id)].slice(0, 5);
      safeSetStorageItem(RECENT_SURAHS_KEY, JSON.stringify(next));
      return next;
    });
  }, [selectedChapter, fromVerse, toVerse, chapters, locale, t.mushaf.invalidRange, onSelectRange]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredChapters = chapters.filter((chapter) => {
    if (!searchQuery.trim()) return true;
    const normalizedQuery = searchQuery.toLowerCase();

    return (
      chapter.name_arabic.includes(normalizedQuery) ||
      chapter.name_simple?.toLowerCase().includes(normalizedQuery) ||
      chapter.translated_name?.name?.toLowerCase().includes(normalizedQuery) ||
      chapter.id.toString().includes(normalizedQuery)
    );
  });

  const recentChapters = recentSurahs
    .map((id) => chapters.find((chapter) => chapter.id === id))
    .filter((chapter): chapter is Chapter => chapter !== undefined);

  const selectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setFromVerse("1");
    setToVerse(chapter.verses_count.toString());
    setError("");
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleHistorySelect = (chapterId: number, from: number, to: number) => {
    const chapter = chapters.find((item) => item.id === chapterId);
    if (!chapter) return;

    setSelectedChapter(chapter);
    setFromVerse(String(from));
    setToVerse(String(to));
    setError("");
  };

  const handleVerseAdjust = (field: "from" | "to", delta: number) => {
    if (!selectedChapter) return;

    const current = Number(field === "from" ? fromVerse : toVerse) || 0;
    const next = Math.max(1, Math.min(selectedChapter.verses_count, current + delta));
    if (field === "from") {
      setFromVerse(next.toString());
    } else {
      setToVerse(next.toString());
    }
    setError("");
  };

  const fromValue = Number(fromVerse);
  const toValue = Number(toVerse);
  const selectedVerseCount =
    selectedChapter &&
    Number.isInteger(fromValue) &&
    Number.isInteger(toValue) &&
    fromValue >= 1 &&
    toValue <= selectedChapter.verses_count &&
    toValue >= fromValue
      ? toValue - fromValue + 1
      : null;

  return (
    <div className="flex h-full flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">{t.mushaf.selectSurah}</label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder={
                  selectedChapter
                    ? isRtl
                      ? selectedChapter.name_arabic
                      : selectedChapter.name_simple
                    : isRtl
                      ? "ابحث باسم السورة أو رقمها…"
                      : "Search surah…"
                }
                className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/35 pe-10"
              />
              {searchQuery ? (
                <MushafButton
                  variant="icon"
                  onClick={() => {
                    setSearchQuery("");
                    setIsDropdownOpen(false);
                  }}
                  icon={<X size={16} />}
                  className={`absolute top-1/2 -translate-y-1/2 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground p-1 ${isRtl ? "left-3" : "right-3"}`}
                />
              ) : (
                <Search
                  size={16}
                  className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground ${isRtl ? "left-3" : "right-3"}`}
                />
              )}
            </div>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-[var(--z-context-menu)] mt-2 w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl"
                >
                  <div className="max-h-[280px] overflow-y-auto">
                    {recentChapters.length > 0 && !searchQuery && (
                      <div className="border-b border-border/60">
                        <div className="sticky top-0 bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                          {isRtl ? "السور الأخيرة" : "Recent"}
                        </div>
                        {recentChapters.map((chapter) => (
                          <MushafButton
                            key={`recent-${chapter.id}`}
                            onClick={() => selectChapter(chapter)}
                            className="flex w-full items-center gap-2 rounded-none bg-transparent px-3 py-2 text-start text-sm font-normal transition-colors hover:bg-accent"
                          >
                            <span className="w-6 text-xs text-muted-foreground">{chapter.id}.</span>
                            <span className="font-medium">{chapter.name_arabic}</span>
                            <span className="ms-auto text-xs text-muted-foreground">
                              {chapter.verses_count} {isRtl ? "آية" : "v."}
                            </span>
                          </MushafButton>
                        ))}
                      </div>
                    )}

                    {!searchQuery && recentChapters.length > 0 && (
                      <div className="sticky top-0 bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                        {isRtl ? "جميع السور" : "All Surahs"}
                      </div>
                    )}

                    {filteredChapters.map((chapter) => (
                      <MushafButton
                        key={`all-${chapter.id}`}
                        onClick={() => selectChapter(chapter)}
                        className="flex w-full items-center gap-2 rounded-none bg-transparent px-3 py-2 text-start text-sm font-normal transition-colors hover:bg-accent"
                      >
                        <span className="w-6 text-xs text-muted-foreground">{chapter.id}.</span>
                        <span className="font-medium">{chapter.name_arabic}</span>
                        {chapter.translated_name?.name ? (
                          <span className="hidden text-xs text-muted-foreground sm:inline">— {chapter.translated_name.name}</span>
                        ) : null}
                        <span className="ms-auto text-xs text-muted-foreground">
                          {chapter.verses_count} {isRtl ? "آية" : "v."}
                        </span>
                      </MushafButton>
                    ))}

                    {filteredChapters.length === 0 && (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        {isRtl ? "لا توجد نتائج" : "No results"}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedChapter && (
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {isRtl ? selectedChapter.name_arabic : selectedChapter.name_simple}
              </span>
              <span className="mx-2">•</span>
              <span>
                {selectedChapter.verses_count} {isRtl ? "آية" : "verses"}
              </span>
              <span className="mx-2">•</span>
              <span>
                {selectedVerseCount
                  ? isRtl
                    ? `${selectedVerseCount} مختارة`
                    : `${selectedVerseCount} selected`
                  : isRtl
                    ? "غير محدد"
                    : "Not set"}
              </span>
            </p>
          )}
        </div>

        <AnimatePresence>
          {selectedChapter && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-border/40 p-3.5"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
                <div className="min-w-0">
                  <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                    {t.mushaf.from} {isRtl ? "الآية" : "verse"}
                  </label>
                  <div className="flex min-w-0 items-center gap-2">
                    <MushafButton
                      variant="icon"
                      onClick={() => handleVerseAdjust("from", -1)}
                      icon={<Minus size={14} />}
                      className="h-10 w-10 border border-border/40 bg-background"
                    />
                    <input
                      type="number"
                      min={1}
                      max={selectedChapter.verses_count}
                      value={fromVerse}
                      onChange={(event) => {
                        setFromVerse(event.target.value);
                        setError("");
                      }}
                      className="verse-range-number-input h-10 min-w-0 flex-1 rounded-xl border border-border/50 bg-background px-3 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/35"
                      placeholder="1"
                      dir="ltr"
                    />
                    <MushafButton
                      variant="icon"
                      onClick={() => handleVerseAdjust("from", 1)}
                      icon={<Plus size={14} />}
                      className="h-10 w-10 border border-border/40 bg-background"
                    />
                  </div>
                </div>

                <div className="hidden items-center justify-center pb-2 sm:flex">
                  <span className="text-xs font-semibold text-muted-foreground">{isRtl ? "إلى" : "to"}</span>
                </div>

                <div className="min-w-0">
                  <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                    {t.mushaf.to} {isRtl ? "الآية" : "verse"}
                  </label>
                  <div className="flex min-w-0 items-center gap-2">
                    <MushafButton
                      variant="icon"
                      onClick={() => handleVerseAdjust("to", -1)}
                      icon={<Minus size={14} />}
                      className="h-10 w-10 border border-border/40 bg-background"
                    />
                    <input
                      type="number"
                      min={1}
                      max={selectedChapter.verses_count}
                      value={toVerse}
                      onChange={(event) => {
                        setToVerse(event.target.value);
                        setError("");
                      }}
                      className="verse-range-number-input h-10 min-w-0 flex-1 rounded-xl border border-border/50 bg-background px-3 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/35"
                      placeholder={selectedChapter.verses_count.toString()}
                      dir="ltr"
                    />
                    <MushafButton
                      variant="icon"
                      onClick={() => handleVerseAdjust("to", 1)}
                      icon={<Plus size={14} />}
                      className="h-10 w-10 border border-border/40 bg-background"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <section className="border-t border-border/35 pt-3">
          <MushafButton
            onClick={() => setShowHistory((prev) => !prev)}
            className="w-full rounded-xl border border-border/35 bg-transparent px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/20"
          >
            <span className="flex w-full min-w-0 items-center justify-between gap-2 whitespace-nowrap">
              <span className="flex min-w-0 items-center gap-2">
                <History size={15} className="text-primary flex-shrink-0" />
                <span className="truncate whitespace-nowrap">{locale === "ar" ? "السجل" : "History"}</span>
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {showHistory ? (locale === "ar" ? "إخفاء" : "Hide") : locale === "ar" ? "إظهار" : "Show"}
              </span>
            </span>
          </MushafButton>

          {showHistory ? (
            <div className="mt-3">
              <RangeHistory onSelectRange={handleHistorySelect} />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default function QuickVerseRangePanel({
  isOpen,
  onClose,
  chapters,
  onSelectRange,
}: {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  onSelectRange: (chapterId: number, from: number, to: number) => void;
}) {
  const { t } = useI18n();

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={70}
      containerClassName="flex items-center justify-center p-4"
      panelClassName="bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden max-w-md w-full mx-auto max-h-[85vh] flex flex-col"
    >
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
        <h3 className="flex items-center gap-2.5 font-['Amiri',serif] text-lg font-bold text-primary">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen size={18} />
          </div>
          {t.mushaf.verseRange}
        </h3>
        <MushafCloseButton onClick={onClose} iconSize={18} />
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <VerseRangeForm chapters={chapters} onSelectRange={onSelectRange} onClose={onClose} />
      </div>
    </ModalShell>
  );
}
