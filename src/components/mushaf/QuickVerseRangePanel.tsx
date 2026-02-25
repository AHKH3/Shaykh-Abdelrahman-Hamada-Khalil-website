"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Plus, Minus, History, BookOpen } from "lucide-react";
import type { Chapter } from "@/lib/quran/api";
import { validateVerseRange } from "@/lib/quran/api";
import { useI18n } from "@/lib/i18n/context";
import { motion, AnimatePresence } from "framer-motion";
import { saveRangeToHistory } from "@/lib/quran/range-utils";

interface VerseRangeFormProps {
  chapters: Chapter[];
  onSelectRange: (chapterId: number, from: number, to: number) => void;
  onClose?: () => void;
  initialChapterId?: number;
  initialFromVerse?: number;
  initialToVerse?: number;
  // kept for compat but unused in simplified UI
  currentVerses?: unknown[];
  currentPage?: number;
  currentAudioVerse?: string | null;
  isPlaying?: boolean;
  onPlayVerse?: (verseKey: string) => void;
  onPauseAudio?: () => void;
  onResumeAudio?: () => void;
  autoCollapseDelay?: number;
  onAutoCollapseDelayChange?: (delay: number) => void;
  isExpanded?: boolean;
  currentVerse?: unknown;
  onTogglePanel?: () => void;
}

const RECENT_SURAHS_KEY = "quran-recent-surahs";
const LAST_SESSION_KEY = "quran-last-session";

export function VerseRangeForm({
  chapters,
  onSelectRange,
  onClose,
  initialChapterId,
  initialFromVerse,
  initialToVerse,
}: VerseRangeFormProps) {
  const { t, locale } = useI18n();

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(
    () => (initialChapterId ? chapters.find((c) => c.id === initialChapterId) || null : null)
  );
  const [fromVerse, setFromVerse] = useState(initialFromVerse?.toString() || "");
  const [toVerse, setToVerse] = useState(initialToVerse?.toString() || "");
  const [error, setError] = useState("");

  // Searchable dropdown
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentSurahs, setRecentSurahs] = useState<number[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Track the last applied range to avoid infinite loops
  const lastAppliedRef = useRef<{ chapterId: number; from: number; to: number } | null>(null);

  // Load persisted data & Initial values
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SURAHS_KEY);
    if (stored) {
      try { setRecentSurahs(JSON.parse(stored)); } catch { /* ignore */ }
    }

    if (initialChapterId) {
      const ch = chapters.find((c) => c.id === initialChapterId);
      if (ch) {
        setSelectedChapter(ch);
        setFromVerse(initialFromVerse?.toString() || "1");
        setToVerse(initialToVerse?.toString() || ch.verses_count.toString());
      }
    } else {
      const ls = localStorage.getItem(LAST_SESSION_KEY);
      if (ls) {
        try {
          const parsed = JSON.parse(ls);
          const ch = chapters.find((c) => c.id === parsed.chapterId);
          if (ch) {
            setSelectedChapter(ch);
            setFromVerse(parsed.from.toString());
            setToVerse(parsed.to.toString());
          }
        } catch { /* ignore */ }
      }
    }
  }, [initialChapterId, initialFromVerse, initialToVerse, chapters]);

  // Auto-apply selection (only when values actually change)
  useEffect(() => {
    if (selectedChapter && fromVerse && toVerse) {
      const from = parseInt(fromVerse);
      const to = parseInt(toVerse);
      if (from > 0 && to > 0 && from <= to) {
        const validation = validateVerseRange(selectedChapter.id, from, to, chapters);
        if (validation.valid) {
          // Skip if same range already applied (prevents infinite loop)
          const last = lastAppliedRef.current;
          if (
            last &&
            last.chapterId === selectedChapter.id &&
            last.from === from &&
            last.to === to
          ) return;

          lastAppliedRef.current = { chapterId: selectedChapter.id, from, to };
          setError("");
          onSelectRange(selectedChapter.id, from, to);

          localStorage.setItem(LAST_SESSION_KEY, JSON.stringify({
            chapterId: selectedChapter.id,
            from,
            to,
            timestamp: Date.now()
          }));
          saveRangeToHistory(selectedChapter.id, selectedChapter.name_arabic, from, to);

          setRecentSurahs((prev) => {
            if (prev[0] === selectedChapter.id) return prev;
            const next = [selectedChapter.id, ...prev.filter((id) => id !== selectedChapter.id)].slice(0, 5);
            localStorage.setItem(RECENT_SURAHS_KEY, JSON.stringify(next));
            return next;
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapter, fromVerse, toVerse, chapters]);

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filtered chapters list
  const filteredChapters = chapters.filter((ch) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ch.name_arabic.includes(q) ||
      ch.name_simple?.toLowerCase().includes(q) ||
      ch.translated_name?.name?.toLowerCase().includes(q) ||
      ch.id.toString().includes(q)
    );
  });

  const recentChapters = recentSurahs
    .map((id) => chapters.find((c) => c.id === id))
    .filter((c): c is Chapter => c !== undefined);

  const selectChapter = (ch: Chapter) => {
    setSelectedChapter(ch);
    setFromVerse("");
    setToVerse("");
    setError("");
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleVerseAdjust = (field: "from" | "to", delta: number) => {
    if (!selectedChapter) return;
    const cur = parseInt(field === "from" ? fromVerse : toVerse) || 0;
    const next = Math.max(1, Math.min(selectedChapter.verses_count, cur + delta));
    if (field === "from") setFromVerse(next.toString());
    else setToVerse(next.toString());
    setError("");
  };

  const handleQuickRange = (from: number, to: number) => {
    if (!selectedChapter) return;
    setFromVerse(from.toString());
    setToVerse(Math.min(to, selectedChapter.verses_count).toString());
    setError("");
  };

  const handleWholeSurah = () => {
    if (!selectedChapter) return;
    setFromVerse("1");
    setToVerse(selectedChapter.verses_count.toString());
    setError("");
  };

  const isRtl = locale === "ar";

  const buttonProps = {
    whileHover: { scale: 1.03, y: -1 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 15 } as const
  };

  return (
    <div className="flex flex-col h-full" dir={isRtl ? "rtl" : "ltr"}>
      {/* Content */}
      <div className="flex-1 overflow-visible p-5 space-y-7">

        {/* ── Surah selector ── */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">
            {t.mushaf.selectSurah}
          </label>
          <div className="relative" ref={dropdownRef}>
            {/* Display selected + search input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder={
                  selectedChapter
                    ? (isRtl ? selectedChapter.name_arabic : selectedChapter.name_simple)
                    : (isRtl ? "ابحث باسم السورة أو رقمها…" : "Search surah…")
                }
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:bg-muted/80 shadow-sm pe-10"
              />
              {searchQuery ? (
                <button
                  onClick={() => { setSearchQuery(""); setIsDropdownOpen(false); }}
                  className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "left-3" : "right-3"} text-muted-foreground hover:text-foreground`}
                >
                  <X size={16} />
                </button>
              ) : (
                <Search
                  size={16}
                  className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "left-3" : "right-3"} pointer-events-none text-muted-foreground`}
                />
              )}
            </div>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute z-[100] w-full mt-2 bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="max-h-[300px] overflow-y-auto">
                    {/* Recent */}
                    {recentChapters.length > 0 && !searchQuery && (
                      <div className="border-b border-border">
                        <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                          {isRtl ? "السور الأخيرة" : "Recent"}
                        </div>
                        {recentChapters.map((ch) => (
                          <button
                            key={ch.id}
                            onClick={() => selectChapter(ch)}
                            className="w-full px-3 py-2 text-sm text-start hover:bg-accent transition-colors flex items-center gap-2"
                          >
                            <span className="text-muted-foreground w-6 text-xs">{ch.id}.</span>
                            <span className="font-medium">{ch.name_arabic}</span>
                            <span className="text-muted-foreground text-xs ms-auto">{ch.verses_count} {isRtl ? "آية" : "v."}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {/* All / filtered */}
                    {!searchQuery && recentChapters.length > 0 && (
                      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                        {isRtl ? "جميع السور" : "All Surahs"}
                      </div>
                    )}
                    {filteredChapters.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => selectChapter(ch)}
                        className="w-full px-3 py-2 text-sm text-start hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <span className="text-muted-foreground w-6 text-xs">{ch.id}.</span>
                        <span className="font-medium">{ch.name_arabic}</span>
                        {ch.translated_name?.name && (
                          <span className="text-muted-foreground text-xs hidden sm:inline">— {ch.translated_name.name}</span>
                        )}
                        <span className="text-muted-foreground text-xs ms-auto">{ch.verses_count} {isRtl ? "آية" : "v."}</span>
                      </button>
                    ))}
                    {filteredChapters.length === 0 && (
                      <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                        {isRtl ? "لا توجد نتائج" : "No results"}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Selected chapter info */}
          {selectedChapter && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1"
            >
              <BookOpen size={12} />
              {isRtl
                ? <>{selectedChapter.name_arabic} — <span className="font-semibold">{selectedChapter.verses_count}</span> آية</>
                : <>{selectedChapter.name_simple} — <span className="font-semibold">{selectedChapter.verses_count}</span> verses</>
              }
            </motion.p>
          )}
        </div>

        {/* ── From / To verse inputs ── */}
        <AnimatePresence>
          {selectedChapter && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* From */}
                <div>
                  <label className="block text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                    {t.mushaf.from} {isRtl ? "الآية" : "Verse"}
                  </label>
                  <div className="flex items-center gap-2">
                    <motion.button
                      {...buttonProps}
                      onClick={() => handleVerseAdjust("from", -1)}
                      className="p-2.5 bg-muted/80 hover:bg-muted rounded-xl border border-border transition-colors text-foreground shadow-sm flex items-center justify-center"
                    >
                      <Minus size={14} />
                    </motion.button>
                    <input
                      type="number"
                      min={1}
                      max={selectedChapter.verses_count}
                      value={fromVerse}
                      onChange={(e) => { setFromVerse(e.target.value); setError(""); }}
                      className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm font-medium text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:bg-muted/80 shadow-sm"
                      placeholder="1"
                      dir="ltr"
                    />
                    <motion.button
                      {...buttonProps}
                      onClick={() => handleVerseAdjust("from", 1)}
                      className="p-2.5 bg-muted/80 hover:bg-muted rounded-xl border border-border transition-colors text-foreground shadow-sm flex items-center justify-center"
                    >
                      <Plus size={14} />
                    </motion.button>
                  </div>
                </div>
                {/* To */}
                <div>
                  <label className="block text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                    {t.mushaf.to} {isRtl ? "الآية" : "Verse"}
                  </label>
                  <div className="flex items-center gap-2">
                    <motion.button
                      {...buttonProps}
                      onClick={() => handleVerseAdjust("to", -1)}
                      className="p-2.5 bg-muted/80 hover:bg-muted rounded-xl border border-border transition-colors text-foreground shadow-sm flex items-center justify-center"
                    >
                      <Minus size={14} />
                    </motion.button>
                    <input
                      type="number"
                      min={1}
                      max={selectedChapter.verses_count}
                      value={toVerse}
                      onChange={(e) => { setToVerse(e.target.value); setError(""); }}
                      className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm font-medium text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:bg-muted/80 shadow-sm"
                      placeholder={selectedChapter.verses_count.toString()}
                      dir="ltr"
                    />
                    <motion.button
                      {...buttonProps}
                      onClick={() => handleVerseAdjust("to", 1)}
                      className="p-2.5 bg-muted/80 hover:bg-muted rounded-xl border border-border transition-colors text-foreground shadow-sm flex items-center justify-center"
                    >
                      <Plus size={14} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* ── Quick range chips ── */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                  {isRtl ? "مدى سريع" : "Quick Range"}
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { label: "١–١٠", from: 1, to: 10 },
                    { label: "١١–٢٠", from: 11, to: 20 },
                    { label: "٢١–٣٠", from: 21, to: 30 },
                    { label: "٣١–٤٠", from: 31, to: 40 },
                  ]
                    .filter((r) => selectedChapter.verses_count >= r.from)
                    .map((r) => (
                      <motion.button
                        key={r.label}
                        {...buttonProps}
                        onClick={() => handleQuickRange(r.from, r.to)}
                        className="px-4 py-2 text-xs bg-muted/80 hover:bg-muted rounded-xl border border-border transition-colors font-semibold shadow-sm text-foreground"
                      >
                        {r.label}
                      </motion.button>
                    ))}
                  <motion.button
                    {...buttonProps}
                    onClick={handleWholeSurah}
                    className="px-4 py-2 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-xl border border-primary/30 transition-colors font-bold shadow-sm"
                  >
                    {t.mushaf.wholeSurah}
                  </motion.button>
                </div>
              </div>

              {/* ── Shift range buttons ── */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                  {isRtl ? "تحريك المدى" : "Shift Range"}
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[-10, -5, +5, +10].map((delta) => {
                    const shift = () => {
                      const from = parseInt(fromVerse) || 1;
                      const to = parseInt(toVerse) || 10;
                      const max = selectedChapter.verses_count;
                      const newFrom = Math.max(1, Math.min(max - 1, from + delta));
                      const newTo = Math.max(2, Math.min(max, to + delta));
                      setFromVerse(newFrom.toString());
                      setToVerse(newTo.toString());
                      setError("");
                    };
                    return (
                      <motion.button
                        key={delta}
                        {...buttonProps}
                        onClick={shift}
                        className="px-3 py-2 text-xs bg-muted/80 hover:bg-muted rounded-xl border border-border transition-colors font-bold shadow-sm text-foreground flex items-center justify-center"
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

// Legacy default export kept for backward compat
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
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border border-border max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <VerseRangeForm chapters={chapters} onSelectRange={onSelectRange} onClose={onClose} />
      </div>
    </div>
  );
}
