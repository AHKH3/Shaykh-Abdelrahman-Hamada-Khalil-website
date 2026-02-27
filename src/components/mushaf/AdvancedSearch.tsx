import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Filter, BookOpen, Layers, List } from "lucide-react";
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
import { useDebounce } from "@/lib/hooks/useDebounce";

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
  const [activeTab, setActiveTab] = useState<"surah" | "juz">("surah");

  // Filters
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [errorMessage, setErrorMessage] = useState<string>("");
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, selectedSurah, selectedJuz]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      handleSearch(1);
    } else {
      setResults([]);
      setTotalResults(0);
    }
  }, [debouncedQuery, selectedSurah, selectedJuz]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (page: number = 1) => {
    if (!query.trim()) return;

    setLoading(true);
    setErrorMessage("");

    try {
      let surahResults: UnifiedSearchResult[] = [];
      if (page === 1 && !selectedSurah) {
        surahResults = searchSurahs(query, chapters, locale);
      }

      const apiResults = await searchQuranAdvanced({
        query,
        language: locale === "ar" ? "ar" : "en",
        page,
        size: 30,
        chapterId: selectedSurah || undefined,
        juzNumber: selectedJuz || undefined,
      });

      const unified = [...surahResults, ...apiResults.results];
      unified.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      setResults(unified);
      setTotalPages(apiResults.totalPages);
      setTotalResults(apiResults.totalResults + surahResults.length);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
      setTotalResults(0);
      setErrorMessage(
        locale === "ar"
          ? "حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى."
          : "An error occurred while searching. Please try again."
      );
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

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage("");
      setQuery("");
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  const juzList = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-card/90 backdrop-blur-2xl max-w-2xl w-full rounded-2xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] overflow-hidden border border-border/40 flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header & Search Input */}
          <div className="p-5 border-b border-border/40 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 group">
                <Search className={`absolute start-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${query ? "text-primary" : "text-muted-foreground"}`} size={18} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={locale === "ar" ? "ابحث عن آية أو سورة أو رقم صفحة..." : "Search for a verse, surah, or page..."}
                  className="w-full bg-muted/50 border border-transparent focus:border-primary/30 rounded-xl px-12 py-3 text-base placeholder:text-muted-foreground/60 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/10"
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => { setQuery(""); setResults([]); }}
                    className="absolute end-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl transition-all duration-300 border ${showFilters
                  ? "bg-primary/20 border-primary/30 text-primary"
                  : "bg-muted/50 border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Filter size={20} />
              </button>
              <button onClick={onClose} className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Filters Sub-panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-1 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">{t.mushaf.searchInSurah}</label>
                    <select
                      value={selectedSurah || ""}
                      onChange={(e) => setSelectedSurah(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-muted/50 border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">{t.mushaf.allSurahs}</option>
                      {chapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.id}. {ch.name_arabic}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">{t.mushaf.searchInJuz}</label>
                    <select
                      value={selectedJuz || ""}
                      onChange={(e) => setSelectedJuz(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-muted/50 border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">{t.mushaf.allJuz}</option>
                      {juzList.map((juz) => (
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

          {/* Results / Navigation Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/30">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">{locale === "ar" ? "جاري البحث..." : "Searching..."}</p>
              </div>
            ) : errorMessage ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
                  <X size={24} />
                </div>
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            ) : query.trim() ? (
              /* Search Results View */
              <div className="divide-y divide-border/40">
                {results.length > 0 ? (
                  <>
                    <div className="px-5 py-2.5 sticky top-0 bg-background/80 backdrop-blur-md z-10 flex items-center justify-between border-b border-border/20">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {totalResults} {t.mushaf.resultsCount}
                      </span>
                    </div>
                    {results.map((result, idx) => (
                      <button
                        key={`${result.type}-${idx}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full p-5 text-start hover:bg-muted/30 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-y-0 start-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                        {result.type === "surah" ? (
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold transition-transform group-hover:scale-110">
                              {result.surahId}
                            </div>
                            <div>
                              <p className="font-bold text-lg font-['Amiri',serif]">{result.surahName}</p>
                              <p className="text-xs text-muted-foreground">{t.mushaf.page} {result.pageNumber}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-muted rounded font-mono text-[10px] text-muted-foreground">
                                {result.verseKey}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {t.mushaf.surah} {result.surahName}
                              </span>
                            </div>
                            <p
                              className="text-lg leading-relaxed font-['Amiri',serif] text-foreground/90"
                              dir="rtl"
                              dangerouslySetInnerHTML={{ __html: result.highlighted || result.text || "" }}
                            />
                          </div>
                        )}
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="p-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground/50">
                      <Search size={32} />
                    </div>
                    <p className="text-muted-foreground text-sm">{t.mushaf.noResults}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Navigation Index (Surah/Juz) */
              <div className="p-1">
                <div className="flex items-center gap-1 p-3 sticky top-0 bg-background/60 backdrop-blur-md z-10 border-b border-border/10 mb-2">
                  <button
                    onClick={() => setActiveTab("surah")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "surah" ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    <Layers size={16} />
                    {t.mushaf.surah}
                  </button>
                  <button
                    onClick={() => setActiveTab("juz")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "juz" ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    <BookOpen size={16} />
                    {locale === "ar" ? "الأجزاء" : "Juz"}
                  </button>
                </div>

                <div className="px-3 pb-5">
                  {activeTab === "surah" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {chapters.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => {
                            onNavigate(SURAH_PAGES[ch.id] || 1);
                            onClose();
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/40 transition-all text-start group"
                        >
                          <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {ch.id}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold font-['Amiri',serif] text-base group-hover:text-primary transition-colors truncate">{ch.name_arabic}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{ch.translated_name.name}</span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span>{ch.verses_count} {locale === "ar" ? "آية" : "v"}</span>
                            </div>
                          </div>
                          <div className="text-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">{t.mushaf.page}</p>
                            <p className="font-bold text-xs text-primary">{SURAH_PAGES[ch.id]}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {juzList.map((juz) => (
                        <button
                          key={juz}
                          onClick={() => {
                            // First surah of each juz page mapping
                            const juzPage = ((juz - 1) * 20) + 2; // Rough mapping for standard Madani
                            onNavigate(juzPage);
                            onClose();
                          }}
                          className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/40 transition-all gap-1 group"
                        >
                          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors uppercase font-bold tracking-widest">{locale === "ar" ? "جزء" : "Juz"}</span>
                          <span className="text-2xl font-black text-foreground group-hover:scale-110 transition-transform">{juz}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && query.trim() && !loading && (
            <div className="p-4 border-t border-border/40 flex items-center justify-center gap-4 bg-muted/20">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-card border border-border/40 hover:bg-muted disabled:opacity-30 transition-colors"
              >
                {locale === "ar" ? <X className="rotate-180" size={16} /> : <X size={16} />}
              </button>
              <div className="text-xs font-bold text-muted-foreground">
                <span className="text-foreground">{currentPage}</span> / {totalPages}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-card border border-border/40 hover:bg-muted disabled:opacity-30 transition-colors"
              >
                {locale === "en" ? <X className="rotate-180" size={16} /> : <X size={16} />}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
