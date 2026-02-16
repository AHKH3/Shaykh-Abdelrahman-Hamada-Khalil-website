"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import type {
  Chapter,
  UnifiedSearchResult,
} from "@/lib/quran/api";
import {
  searchQuranAdvanced,
  searchSurahs,
  SURAH_PAGES,
} from "@/lib/quran/api";
import { useI18n } from "@/lib/i18n/context";

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  onNavigate: (pageNumber: number, verseKey?: string) => void;
}

export default function AdvancedSearch({
  isOpen,
  onClose,
  chapters,
  onNavigate,
}: AdvancedSearchProps) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnifiedSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Reset page when query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedSurah, selectedJuz]);

  const handleSearch = async (page: number = 1) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // 1. Search in verse text via API
      const apiResults = await searchQuranAdvanced({
        query,
        language: locale === "ar" ? "ar" : "en",
        page,
        size: 30,
        chapterId: selectedSurah || undefined,
        juzNumber: selectedJuz || undefined,
      });

      // 2. Local search in surah names (only on first page and if no surah filter)
      let surahResults: UnifiedSearchResult[] = [];
      if (page === 1 && !selectedSurah) {
        surahResults = searchSurahs(query, chapters, locale);
      }

      // 3. Merge results (surahs first due to higher matchScore)
      const unified = [...surahResults, ...apiResults.results];

      // 4. Sort by match score
      unified.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      setResults(unified);
      setTotalPages(apiResults.totalPages);
      setTotalResults(apiResults.totalResults + surahResults.length);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    handleSearch(newPage);
  };

  const handleResultClick = (result: UnifiedSearchResult) => {
    if (result.type === "surah") {
      onNavigate(result.pageNumber!);
    } else {
      const [surahId] = result.verseKey!.split(":").map(Number);
      const page = SURAH_PAGES[surahId];
      onNavigate(page, result.verseKey);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      onClose();
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
          className="bg-card max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3 mb-3">
              <Search size={20} className="text-primary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.mushaf.searchPlaceholder}
                className="flex-1 bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
                dir={locale === "ar" ? "rtl" : "ltr"}
                autoFocus
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters
                    ? "bg-primary text-white"
                    : "bg-muted hover:bg-muted/80"
                }`}
                title={t.mushaf.filters}
              >
                <Filter size={18} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 pt-3 border-t border-border overflow-hidden"
                >
                  {/* Surah Filter */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {t.mushaf.searchInSurah}
                    </label>
                    <select
                      value={selectedSurah || ""}
                      onChange={(e) =>
                        setSelectedSurah(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">{t.mushaf.allSurahs}</option>
                      {chapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.id}. {ch.name_arabic} - {ch.translated_name.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Juz Filter */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {t.mushaf.searchInJuz}
                    </label>
                    <select
                      value={selectedJuz || ""}
                      onChange={(e) =>
                        setSelectedJuz(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">{t.mushaf.allJuz}</option>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                        <option key={juz} value={juz}>
                          {locale === "ar" ? `الجزء ${juz}` : `Juz ${juz}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results */}
          <div className="max-h-[500px] overflow-auto">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : results.length > 0 ? (
              <div>
                {/* Results count */}
                <div className="px-4 py-2 bg-muted/20 border-b border-border text-xs text-muted-foreground">
                  {totalResults} {t.mushaf.resultsCount}
                </div>

                {/* Results list */}
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${index}-${result.verseKey || result.surahId}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full p-4 hover:bg-muted/50 transition-colors border-b border-border text-start"
                  >
                    {result.type === "surah" ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">
                            {t.mushaf.surah}
                          </span>
                          <p className="text-sm font-medium">
                            {result.surahName}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t.mushaf.page} {result.pageNumber}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {result.verseKey}
                        </p>
                        <p
                          className="text-sm leading-relaxed font-['Amiri',serif]"
                          dir="rtl"
                          dangerouslySetInnerHTML={{
                            __html: result.highlighted || result.text || "",
                          }}
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : query.trim() ? (
              <p className="text-center text-muted-foreground p-8">
                {t.mushaf.noResults}
              </p>
            ) : (
              <p className="text-center text-muted-foreground p-8">
                {locale === "ar"
                  ? "ابحث عن آية أو سورة..."
                  : "Search for a verse or surah..."}
              </p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && results.length > 0 && (
            <div className="p-4 border-t border-border flex items-center justify-center gap-2 bg-muted/20">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
              >
                {t.mushaf.previous}
              </button>
              <span className="text-sm px-3">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
              >
                {t.mushaf.next}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
