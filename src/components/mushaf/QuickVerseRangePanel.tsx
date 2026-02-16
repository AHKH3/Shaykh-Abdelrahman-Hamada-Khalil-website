"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, ChevronRight, ChevronDown } from "lucide-react";
import type { Chapter } from "@/lib/quran/api";
import { validateVerseRange } from "@/lib/quran/api";
import { useI18n } from "@/lib/i18n/context";

interface QuickVerseRangePanelProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  onSelectRange: (chapterId: number, from: number, to: number) => void;
}

export default function QuickVerseRangePanel({
  isOpen,
  onClose,
  chapters,
  onSelectRange,
}: QuickVerseRangePanelProps) {
  const { t, locale } = useI18n();
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [fromVerse, setFromVerse] = useState("");
  const [toVerse, setToVerse] = useState("");
  const [error, setError] = useState("");

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedChapter(null);
      setFromVerse("");
      setToVerse("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedChapter) {
      setError(
        locale === "ar" ? "اختر سورة" : "Select a surah"
      );
      return;
    }

    const from = parseInt(fromVerse);
    const to = parseInt(toVerse);

    // Validation
    if (!from || !to) {
      setError(t.mushaf.enterVerseNumbers);
      return;
    }

    const validation = validateVerseRange(
      selectedChapter.id,
      from,
      to,
      chapters
    );

    if (!validation.valid) {
      setError(locale === "ar" ? validation.error! : validation.errorEn!);
      return;
    }

    setError("");
    onSelectRange(selectedChapter.id, from, to);
    onClose();
  };

  const handleQuickRange = (from: number, to: number) => {
    setFromVerse(from.toString());
    setToVerse(to.toString());
    setError("");
  };

  const handleWholeSurah = () => {
    if (selectedChapter) {
      setFromVerse("1");
      setToVerse(selectedChapter.verses_count.toString());
      setError("");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border border-border max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border bg-muted/30 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen size={18} className="text-primary" />
                {t.mushaf.verseRangeSelector}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Surah Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.mushaf.selectSurah}
              </label>
              <div className="relative">
                <select
                  value={selectedChapter?.id || ""}
                  onChange={(e) => {
                    const ch = chapters.find(
                      (c) => c.id === Number(e.target.value)
                    );
                    setSelectedChapter(ch || null);
                    setFromVerse("");
                    setToVerse("");
                    setError("");
                  }}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none pr-8"
                  dir={locale === "ar" ? "rtl" : "ltr"}
                >
                  <option value="">
                    {locale === "ar" ? "-- اختر سورة --" : "-- Select Surah --"}
                  </option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.id}. {ch.name_arabic} - {ch.translated_name.name} (
                      {ch.verses_count} {locale === "ar" ? "آية" : "verses"})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className={`absolute top-1/2 -translate-y-1/2 ${locale === "ar" ? "left-3" : "right-3"
                    } pointer-events-none text-muted-foreground`}
                />
              </div>
            </div>

            {/* Verse Range Input */}
            {selectedChapter && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Range Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  {/* From Verse */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t.mushaf.from} {locale === "ar" ? "الآية" : "verse"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedChapter.verses_count}
                      value={fromVerse}
                      onChange={(e) => {
                        setFromVerse(e.target.value);
                        setError("");
                      }}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="1"
                      dir="ltr"
                    />
                  </div>

                  {/* To Verse */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t.mushaf.to} {locale === "ar" ? "الآية" : "verse"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedChapter.verses_count}
                      value={toVerse}
                      onChange={(e) => {
                        setToVerse(e.target.value);
                        setError("");
                      }}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder={selectedChapter.verses_count.toString()}
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Quick Selections */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.mushaf.quickRanges}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleQuickRange(1, 10)}
                      className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors"
                    >
                      1-10
                    </button>
                    <button
                      onClick={() => handleQuickRange(11, 20)}
                      className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors"
                      disabled={selectedChapter.verses_count < 11}
                    >
                      11-20
                    </button>
                    <button
                      onClick={() => handleQuickRange(21, 30)}
                      className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors"
                      disabled={selectedChapter.verses_count < 21}
                    >
                      21-30
                    </button>
                    <button
                      onClick={handleWholeSurah}
                      className="px-3 py-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg border border-primary/30 transition-colors font-medium"
                    >
                      {t.mushaf.wholeSurah}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar" ? (
                      <>
                        السورة المختارة: <strong>{selectedChapter.name_arabic}</strong>
                        <br />
                        عدد الآيات: <strong>{selectedChapter.verses_count}</strong>
                      </>
                    ) : (
                      <>
                        Selected surah: <strong>{selectedChapter.name_simple}</strong>
                        <br />
                        Total verses: <strong>{selectedChapter.verses_count}</strong>
                      </>
                    )}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </motion.div>
            )}
          </div>

          {/* Actions - Sticky at bottom */}
          <div className="sticky bottom-0 p-4 border-t border-border bg-card">
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors font-medium"
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedChapter || !fromVerse || !toVerse}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {t.mushaf.showRange}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
