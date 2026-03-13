"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Minus, BookOpen, History } from "lucide-react";
import type { Chapter } from "@/lib/quran/api";
import { validateVerseRange } from "@/lib/quran/api";
import { useI18n } from "@/lib/i18n/context";
import { motion, AnimatePresence } from "framer-motion";
import { saveRangeToHistory } from "@/lib/quran/range-utils";
import { RangeHistory } from "./verse-range/RangeHistory";
import MushafButton from "./ui/MushafButton";
import ModalShell from "@/components/ui/ModalShell";
import EngravedInput from "@/components/ui/EngravedInput";
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
    <div data-testid="mushaf-verse-range-panel" className="flex h-full flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">{t.mushaf.selectSurah}</label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <EngravedInput
                value={searchQuery}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
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
                containerClassName="w-full"
              />
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
                        <div className="mushaf-text-compact sticky top-0 bg-muted/60 px-3 py-1.5 font-semibold text-muted-foreground">
                          {isRtl ? "السور الأخيرة" : "Recent"}
                        </div>
                        {recentChapters.map((chapter) => (
                          <MushafButton
                            key={`recent-${chapter.id}`}
                            onClick={() => selectChapter(chapter)}
                            className="flex w-full items-center gap-2 rounded-none bg-transparent px-3 py-2 text-start text-sm font-normal transition-colors hover:bg-accent"
                          >
                            <span className="mushaf-text-meta w-6 text-muted-foreground">{chapter.id}.</span>
                            <span className="font-medium">{chapter.name_arabic}</span>
                            <span className="mushaf-text-meta ms-auto text-muted-foreground">
                              {chapter.verses_count} {isRtl ? "آية" : "v."}
                            </span>
                          </MushafButton>
                        ))}
                      </div>
                    )}

                    {!searchQuery && recentChapters.length > 0 && (
                      <div className="mushaf-text-compact sticky top-0 bg-muted/60 px-3 py-1.5 font-semibold text-muted-foreground">
                        {isRtl ? "جميع السور" : "All Surahs"}
                      </div>
                    )}

                    {filteredChapters.map((chapter) => (
                      <MushafButton
                        key={`all-${chapter.id}`}
                        onClick={() => selectChapter(chapter)}
                        className="flex w-full items-center gap-2 rounded-none bg-transparent px-3 py-2 text-start text-sm font-normal transition-colors hover:bg-accent"
                      >
                        <span className="mushaf-text-meta w-6 text-muted-foreground">{chapter.id}.</span>
                        <span className="font-medium">{chapter.name_arabic}</span>
                        {chapter.translated_name?.name ? (
                          <span className="mushaf-text-meta hidden text-muted-foreground sm:inline">— {chapter.translated_name.name}</span>
                        ) : null}
                        <span className="mushaf-text-meta ms-auto text-muted-foreground">
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
            <p className="mushaf-text-meta mt-2 text-muted-foreground">
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
                  <label className="mushaf-text-compact mb-2 block font-semibold text-muted-foreground">
                    {t.mushaf.from} {isRtl ? "الآية" : "verse"}
                  </label>
                  <div className="flex min-w-0 items-center gap-2">
                    <MushafButton
                      variant="icon"
                      onClick={() => handleVerseAdjust("from", -1)}
                      icon={<Minus size={14} />}
                      className="h-10 w-10 border border-border/40 bg-background"
                    />
                    <EngravedInput
                      type="number"
                      min={1}
                      max={selectedChapter.verses_count}
                      value={fromVerse}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setFromVerse(event.target.value);
                        setError("");
                      }}
                      className="verse-range-number-input text-center font-semibold p-0 h-10"
                      containerClassName="min-w-0 flex-1 h-10 px-0"
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
                  <span className="mushaf-text-compact font-semibold text-muted-foreground">{isRtl ? "إلى" : "to"}</span>
                </div>

                <div className="min-w-0">
                  <label className="mushaf-text-compact mb-2 block font-semibold text-muted-foreground">
                    {t.mushaf.to} {isRtl ? "الآية" : "verse"}
                  </label>
                  <div className="flex min-w-0 items-center gap-2">
                    <MushafButton
                      variant="icon"
                      onClick={() => handleVerseAdjust("to", -1)}
                      icon={<Minus size={14} />}
                      className="h-10 w-10 border border-border/40 bg-background"
                    />
                    <EngravedInput
                      type="number"
                      min={1}
                      max={selectedChapter.verses_count}
                      value={toVerse}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setToVerse(event.target.value);
                        setError("");
                      }}
                      className="verse-range-number-input text-center font-semibold p-0 h-10"
                      containerClassName="min-w-0 flex-1 h-10 px-0"
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
              <span className="mushaf-text-compact text-muted-foreground flex-shrink-0">
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
      backdropClassName="bg-black/50 backdrop-blur-sm"
      containerClassName="flex items-end sm:items-center justify-center p-0 sm:p-4"
      panelClassName="bg-card/95 backdrop-blur-xl border border-white/10 dark:border-white/5 sm:border-primary/10 rounded-t-3xl sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] overflow-hidden max-w-md w-full mx-auto flex flex-col max-h-[85vh] transition-all duration-500"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 bg-primary/5 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60" />
        <h3 className="flex items-center gap-3 font-['Amiri',serif] text-lg font-bold text-primary">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
            <BookOpen size={20} />
          </div>
          {t.mushaf.verseRange}
        </h3>
        <MushafCloseButton onClick={onClose} iconSize={20} />
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <VerseRangeForm chapters={chapters} onSelectRange={onSelectRange} onClose={onClose} />
      </div>
    </ModalShell>
  );
}
