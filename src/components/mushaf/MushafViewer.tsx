"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  BookOpen,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Settings,
  Layers,
  X,
  Check,
  Bookmark,
  Keyboard,
  Moon,
  Sun,
  HelpCircle,
  Scroll,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import {
  getVersesByPage,
  getChapters,
  searchQuran,
  getTafsir,
  RECITERS,
  SURAH_PAGES,
  TOTAL_PAGES,
  getAudioUrl,
  type Verse,
  type Chapter,
} from "@/lib/quran/api";
import VerseOptionsMenu from "./VerseOptionsMenu";
import TafsirPanel from "./TafsirPanel";
import DisplaySettings from "./DisplaySettings";
import { isBookmarked, addBookmark, removeBookmarkByVerseKey, getBookmarks } from "@/lib/quran/bookmarks";
import { copyVerseToClipboard, shareVerse } from "@/lib/quran/export";

export default function MushafViewer() {
  const { t, locale, dir } = useI18n();
  const [currentPage, setCurrentPage] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [nextPageVerses, setNextPageVerses] = useState<Verse[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [highlightedVerse, setHighlightedVerse] = useState<string | null>(null);
  const [tafsirText, setTafsirText] = useState("");
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ verse_key: string; text: string; highlighted: string }>
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioVerse, setCurrentAudioVerse] = useState<string | null>(null);
  const [selectedReciter, setSelectedReciter] = useState(7);
  const [pageInput, setPageInput] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Verse options menu
  const [verseMenuPosition, setVerseMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedVerseForMenu, setSelectedVerseForMenu] = useState<Verse | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Display settings
  const [fontSize, setFontSize] = useState(32);
  const [pageWidth, setPageWidth] = useState<"normal" | "wide" | "full">("normal");
  const [displayMode, setDisplayMode] = useState<"single" | "double">("single");
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [readingMode, setReadingMode] = useState<"normal" | "sepia" | "dark">("normal");

  // Additional features
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Helper functions for display settings
  const getFontSizeClass = (size: number) => {
    switch (size) {
      case 24: return "text-2xl";
      case 32: return "text-4xl";
      case 40: return "text-5xl";
      case 48: return "text-6xl";
      default: return "text-4xl";
    }
  };

  const getPageWidthClass = (width: string) => {
    switch (width) {
      case "normal": return "max-w-3xl";
      case "wide": return "max-w-5xl";
      case "full": return "max-w-7xl";
      default: return "max-w-3xl";
    }
  };

  const getReadingModeClass = (mode: string) => {
    switch (mode) {
      case "normal": return "bg-background text-foreground";
      case "sepia": return "bg-[#f4ecd8] text-[#5c4b37]";
      case "dark": return "bg-[#1a1a2e] text-[#eaeaea]";
      default: return "bg-background text-foreground";
    }
  };

  // Load chapters
  useEffect(() => {
    getChapters(locale === "ar" ? "ar" : "en").then(setChapters).catch(console.error);
  }, [locale]);

  // Load page verses
  const loadPage = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const data = await getVersesByPage(page);
      setVerses(data.verses);
      // Load next page for double page mode
      if (page < TOTAL_PAGES) {
        const nextData = await getVersesByPage(page + 1);
        setNextPageVerses(nextData.verses);
      } else {
        setNextPageVerses([]);
      }
    } catch (err) {
      console.error("Failed to load page:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(currentPage);
  }, [currentPage, loadPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= TOTAL_PAGES) {
      setCurrentPage(page);
      setSelectedVerse(null);
      setShowTafsir(false);
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Get current surah info
  const getCurrentSurah = () => {
    if (verses.length === 0) return null;
    const chapterId = verses[0].chapter_id;
    return chapters.find((c) => c.id === chapterId);
  };

  const getCurrentJuz = () => {
    if (verses.length === 0) return null;
    return verses[0].juz_number;
  };

  // Tafsir
  const handleTafsir = async (verseKey: string) => {
    setSelectedVerse(verseKey);
    setShowTafsir(true);
    setTafsirLoading(true);
    try {
      const data = await getTafsir(verseKey);
      setTafsirText(data.text);
    } catch {
      setTafsirText(locale === "ar" ? "لم يتم العثور على التفسير" : "Tafsir not found");
    } finally {
      setTafsirLoading(false);
    }
  };

  // Highlight verse on click
  const handleVerseClick = (verseKey: string) => {
    setHighlightedVerse(verseKey === highlightedVerse ? null : verseKey);
  };

  // Verse options menu handlers
  const handleVerseNumberClick = (verse: Verse, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedVerseForMenu(verse);
    setVerseMenuPosition({ x: event.clientX, y: event.clientY });
  };

  const handleCloseVerseMenu = () => {
    setVerseMenuPosition(null);
    setSelectedVerseForMenu(null);
  };

  const handleCopyVerse = async () => {
    if (!selectedVerseForMenu) return;
    const success = await copyVerseToClipboard(selectedVerseForMenu.verse_key, selectedVerseForMenu.text_uthmani);
    showToast(success ? t.mushaf.copied : t.common.error, success ? "success" : "error");
  };

  const handleShareVerse = async () => {
    if (!selectedVerseForMenu) return;
    const success = await shareVerse(selectedVerseForMenu.verse_key, selectedVerseForMenu.text_uthmani);
    if (!success) {
      showToast(locale === "ar" ? "المشاركة غير مدعومة" : "Sharing not supported", "error");
    }
  };

  const handleBookmarkVerse = () => {
    if (!selectedVerseForMenu) return;
    const verseKey = selectedVerseForMenu.verse_key;
    if (isBookmarked(verseKey)) {
      removeBookmarkByVerseKey(verseKey);
      showToast(locale === "ar" ? "تم إزالة العلامة المرجعية" : "Bookmark removed", "success");
    } else {
      addBookmark(verseKey, selectedVerseForMenu.chapter_id, selectedVerseForMenu.page_number);
      showToast(locale === "ar" ? "تمت إضافة علامة مرجعية" : "Bookmark added", "success");
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const data = await searchQuran(searchQuery, locale === "ar" ? "ar" : "en");
      setSearchResults(data.search.results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Search for surah by name
  const handleSearchSurah = () => {
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim().toLowerCase();
    const matchedChapter = chapters.find((chapter) => {
      const arabicName = chapter.name_arabic?.toLowerCase() || "";
      const englishName = chapter.name_simple?.toLowerCase() || "";
      const translatedName = chapter.translated_name?.name?.toLowerCase() || "";
      return (
        arabicName.includes(query) ||
        englishName.includes(query) ||
        translatedName.includes(query)
      );
    });

    if (matchedChapter) {
      const page = SURAH_PAGES[matchedChapter.id];
      if (page) {
        goToPage(page);
        setShowSearch(false);
      }
    }
  };

  // Audio
  const playVerse = (verseKey: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const [chapter, verse] = verseKey.split(":").map(Number);
    const url = getAudioUrl(selectedReciter, chapter, verse);

    const audio = new Audio(url);
    audioRef.current = audio;
    setCurrentAudioVerse(verseKey);
    setIsPlaying(true);

    audio.play().catch(console.error);
    audio.onended = () => {
      // Play next verse on same page
      const currentIndex = verses.findIndex((v) => v.verse_key === verseKey);
      if (currentIndex < verses.length - 1) {
        playVerse(verses[currentIndex + 1].verse_key);
      } else {
        setIsPlaying(false);
        setCurrentAudioVerse(null);
      }
    };
  };

  const playPage = () => {
    if (verses.length > 0) {
      playVerse(verses[0].verse_key);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentAudioVerse(null);
  };

  // Auto-scroll
  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    if (autoScroll && scrollContainerRef.current) {
      scrollInterval = setInterval(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop += scrollSpeed;
        }
      }, 50);
    }
    return () => {
      if (scrollInterval) clearInterval(scrollInterval);
    };
  }, [autoScroll, scrollSpeed]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") nextPage();
      if (e.key === "ArrowRight") prevPage();
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowNav(false);
        setShowTafsir(false);
        setShowDisplaySettings(false);
        setShowBookmarks(false);
        setShowShortcuts(false);
      }
      if (e.key === "f" || e.key === "F") setShowSearch(true);
      if (e.key === "?") setShowShortcuts(true);
      if (e.key === " ") {
        e.preventDefault();
        isPlaying ? stopAudio() : playPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isPlaying]);

  const currentSurah = getCurrentSurah();
  const currentJuz = getCurrentJuz();

  // Group verses by surah for page display
  const groupedVerses: Array<{ chapterId: number; chapterName: string; verses: Verse[] }> = [];
  verses.forEach((verse) => {
    const last = groupedVerses[groupedVerses.length - 1];
    if (last && last.chapterId === verse.chapter_id) {
      last.verses.push(verse);
    } else {
      const chapter = chapters.find((c) => c.id === verse.chapter_id);
      groupedVerses.push({
        chapterId: verse.chapter_id,
        chapterName: chapter?.name_arabic || `سورة ${verse.chapter_id}`,
        verses: [verse],
      });
    }
  });

  return (
    <div className={`flex flex-col h-[calc(100vh-4rem)] ${readingMode === 'dark' ? 'dark-reading-mode' : ''} transition-colors duration-300`}>
      {/* Progress Bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(currentPage / TOTAL_PAGES) * 100}%` }}
        />
      </div>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNav(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-sm flex items-center gap-2"
          >
            <Layers size={16} />
            <span className="hidden sm:inline">
              {currentSurah?.name_arabic || ""}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={t.mushaf.search}
          >
            <Search size={16} />
          </button>
          <button
            onClick={() => setShowBookmarks(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={locale === "ar" ? "الإشارات المرجعية" : "Bookmarks"}
          >
            <Bookmark size={16} />
          </button>
          <button
            onClick={isPlaying ? stopAudio : playPage}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={isPlaying ? t.mushaf.pause : t.mushaf.audio}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-2 rounded-lg transition-colors ${autoScroll ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            title={locale === "ar" ? "التمرير التلقائي" : "Auto Scroll"}
          >
            <Scroll size={16} />
          </button>
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={locale === "ar" ? "اختصارات لوحة المفاتيح" : "Keyboard Shortcuts"}
          >
            <Keyboard size={16} />
          </button>
          <button
            onClick={() => setShowDisplaySettings(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={t.mushaf.displaySettings}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative" ref={scrollContainerRef}>
        <div className={`${getPageWidthClass(pageWidth)} mx-auto px-4 py-8`}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.5, type: "spring" }}
              style={{ transformStyle: "preserve-3d", perspective: "1500px" }}
            >
              {/* Mushaf Page Frame */}
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-10 page-flip">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                  <span className="text-xs text-muted-foreground font-medium">
                    {t.mushaf.juz} {currentJuz}
                  </span>
                </div>

                {/* Verses */}
                {displayMode === 'double' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Left Page */}
                    <div className={`quran-text text-center leading-[2.5] ${getFontSizeClass(fontSize)}`} dir="rtl">
                      {groupedVerses.map((group, gi) => (
                        <div key={gi}>
                          {/* Surah header if first verse is verse 1 */}
                          {group.verses[0].verse_number === 1 && (
                            <div className="my-8 text-center">
                              <div className="inline-block px-12 py-3 bg-muted/50 rounded-2xl border border-border/50">
                                <h3 className="text-xl font-bold font-['Amiri',serif] text-foreground">
                                  {group.chapterName}
                                </h3>
                              </div>
                              {/* Bismillah - skip for Surah At-Tawbah (9) and Al-Fatiha (1) already has it */}
                              {group.chapterId !== 9 && group.chapterId !== 1 && (
                                <p className="mt-4 text-lg font-['Amiri',serif] text-muted-foreground">
                                  بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                                </p>
                              )}
                            </div>
                          )}

                          {group.verses.map((verse) => (
                            <span
                              key={verse.verse_key}
                              className={`cursor-pointer transition-colors inline ${currentAudioVerse === verse.verse_key
                                ? "verse-highlight"
                                : highlightedVerse === verse.verse_key
                                  ? "bg-yellow-200/30 dark:bg-yellow-500/20"
                                  : "hover:text-foreground/70"
                                }`}
                              onClick={() => handleVerseClick(verse.verse_key)}
                            >
                              {verse.text_uthmani}{" "}
                              <span
                                className="inline-flex items-center justify-center text-base text-muted-foreground font-sans mx-1 min-w-[1.5rem] hover:bg-muted/50 rounded cursor-pointer"
                                onClick={(e) => handleVerseNumberClick(verse, e)}
                              >
                                ﴿{verse.verse_number.toLocaleString("ar-EG")}﴾
                              </span>{" "}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                    {/* Right Page */}
                    {nextPageVerses.length > 0 && (
                      <div className={`quran-text text-center leading-[2.5] ${getFontSizeClass(fontSize)}`} dir="rtl">
                        {(() => {
                          const nextGroupedVerses: Array<{ chapterId: number; chapterName: string; verses: Verse[] }> = [];
                          nextPageVerses.forEach((verse) => {
                            const last = nextGroupedVerses[nextGroupedVerses.length - 1];
                            if (last && last.chapterId === verse.chapter_id) {
                              last.verses.push(verse);
                            } else {
                              const chapter = chapters.find((c) => c.id === verse.chapter_id);
                              nextGroupedVerses.push({
                                chapterId: verse.chapter_id,
                                chapterName: chapter?.name_arabic || `سورة ${verse.chapter_id}`,
                                verses: [verse],
                              });
                            }
                          });
                          return nextGroupedVerses.map((group, gi) => (
                            <div key={gi}>
                              {group.verses.map((verse) => (
                                <span
                                  key={verse.verse_key}
                                  className={`cursor-pointer transition-colors inline ${currentAudioVerse === verse.verse_key
                                    ? "verse-highlight"
                                    : highlightedVerse === verse.verse_key
                                      ? "bg-yellow-200/30 dark:bg-yellow-500/20"
                                      : "hover:text-foreground/70"
                                    }`}
                                  onClick={() => handleVerseClick(verse.verse_key)}
                                >
                                  {verse.text_uthmani}{" "}
                                  <span
                                    className="inline-flex items-center justify-center text-base text-muted-foreground font-sans mx-1 min-w-[1.5rem] hover:bg-muted/50 rounded cursor-pointer"
                                    onClick={(e) => handleVerseNumberClick(verse, e)}
                                  >
                                    ﴿{verse.verse_number.toLocaleString("ar-EG")}﴾
                                  </span>{" "}
                                </span>
                              ))}
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`quran-text text-center leading-[2.5] ${getFontSizeClass(fontSize)}`} dir="rtl">
                    {groupedVerses.map((group, gi) => (
                      <div key={gi}>
                        {/* Surah header if first verse is verse 1 */}
                        {group.verses[0].verse_number === 1 && (
                          <div className="my-8 text-center">
                            <div className="inline-block px-12 py-3 bg-muted/50 rounded-2xl border border-border/50">
                              <h3 className="text-xl font-bold font-['Amiri',serif] text-foreground">
                                {group.chapterName}
                              </h3>
                            </div>
                            {/* Bismillah - skip for Surah At-Tawbah (9) and Al-Fatiha (1) already has it */}
                            {group.chapterId !== 9 && group.chapterId !== 1 && (
                              <p className="mt-4 text-lg font-['Amiri',serif] text-muted-foreground">
                                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                              </p>
                            )}
                          </div>
                        )}

                        {group.verses.map((verse) => (
                          <span
                            key={verse.verse_key}
                            className={`cursor-pointer transition-colors inline ${currentAudioVerse === verse.verse_key
                              ? "verse-highlight"
                              : highlightedVerse === verse.verse_key
                                ? "bg-yellow-200/30 dark:bg-yellow-500/20"
                                : "hover:text-foreground/70"
                              }`}
                            onClick={() => handleVerseClick(verse.verse_key)}
                          >
                            {verse.text_uthmani}{" "}
                            <span
                              className="inline-flex items-center justify-center text-base text-muted-foreground font-sans mx-1 min-w-[1.5rem] hover:bg-muted/50 rounded cursor-pointer"
                              onClick={(e) => handleVerseNumberClick(verse, e)}
                            >
                              ﴿{verse.verse_number.toLocaleString("ar-EG")}﴾
                            </span>{" "}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={dir === "rtl" ? prevPage : nextPage}
          disabled={dir === "rtl" ? currentPage <= 1 : currentPage >= TOTAL_PAGES}
          className="fixed start-2 top-1/2 -translate-y-1/2 p-3 bg-card border border-border rounded-full hover:bg-muted transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed z-10"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={dir === "rtl" ? nextPage : prevPage}
          disabled={dir === "rtl" ? currentPage >= TOTAL_PAGES : currentPage <= 1}
          className="fixed end-2 top-1/2 -translate-y-1/2 p-3 bg-card border border-border rounded-full hover:bg-muted transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed z-10"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-t border-border">
        <button
          onClick={prevPage}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-muted rounded-lg transition-colors disabled:opacity-30"
        >
          <SkipBack size={14} />
          {t.mushaf.prevPage}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {currentPage} / {TOTAL_PAGES}
          </span>
        </div>

        <button
          onClick={nextPage}
          disabled={currentPage >= TOTAL_PAGES}
          className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-muted rounded-lg transition-colors disabled:opacity-30"
        >
          {t.mushaf.nextPage}
          <SkipForward size={14} />
        </button>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 shadow-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Search size={18} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={t.mushaf.searchPlaceholder}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  autoFocus
                  dir="rtl"
                />
                <button
                  onClick={handleSearchSurah}
                  className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  title={t.mushaf.searchSurah}
                >
                  {t.mushaf.searchSurah}
                </button>
                <button onClick={() => setShowSearch(false)}>
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="max-h-96 overflow-auto">
                {searchLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-border">
                    {searchResults.map((result) => (
                      <button
                        key={result.verse_key}
                        className="w-full text-start p-4 hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          const [surahId] = result.verse_key.split(":").map(Number);
                          const page = SURAH_PAGES[surahId];
                          if (page) goToPage(page);
                          setShowSearch(false);
                        }}
                      >
                        <p className="text-xs text-muted-foreground mb-1">
                          {result.verse_key}
                        </p>
                        <p
                          className="text-sm font-['Amiri',serif] leading-relaxed"
                          dir="rtl"
                          dangerouslySetInnerHTML={{ __html: result.highlighted || result.text }}
                        />
                      </button>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <p className="text-center text-muted-foreground text-sm p-8">
                    {locale === "ar" ? "لا توجد نتائج" : "No results"}
                  </p>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Surah/Juz Navigation Modal */}
      <AnimatePresence>
        {showNav && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowNav(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 shadow-lg overflow-hidden max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold font-['Amiri',serif]">
                  {t.mushaf.surah}
                </h3>
                <button onClick={() => setShowNav(false)}>
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
              <div className="overflow-auto max-h-[calc(80vh-60px)] divide-y divide-border">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      goToPage(SURAH_PAGES[chapter.id] || 1);
                      setShowNav(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-muted rounded-lg text-xs font-medium">
                        {chapter.id}
                      </span>
                      <div className="text-start">
                        <p className="text-sm font-medium">{chapter.name_arabic}</p>
                        <p className="text-xs text-muted-foreground">
                          {chapter.translated_name.name} - {chapter.verses_count}{" "}
                          {locale === "ar" ? "آية" : "verses"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t.mushaf.page} {SURAH_PAGES[chapter.id]}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tafsir Panel */}
      <AnimatePresence>
        {showTafsir && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setShowTafsir(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-lg mx-0 sm:mx-4 shadow-lg overflow-hidden max-h-[70vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold font-['Amiri',serif]">
                    {t.mushaf.tafsir}
                  </h3>
                  <p className="text-xs text-muted-foreground">{selectedVerse}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedVerse && (
                    <button
                      onClick={() => playVerse(selectedVerse)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Play size={14} />
                    </button>
                  )}
                  <button onClick={() => setShowTafsir(false)}>
                    <X size={18} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-auto max-h-[calc(70vh-60px)]">
                {tafsirLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                  </div>
                ) : (
                  <div
                    className="text-sm leading-relaxed text-muted-foreground"
                    dir="rtl"
                    dangerouslySetInnerHTML={{ __html: tafsirText }}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bookmarks Panel */}
      <AnimatePresence>
        {showBookmarks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowBookmarks(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 shadow-lg overflow-hidden max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Bookmark size={18} />
                  {locale === "ar" ? "الإشارات المرجعية" : "Bookmarks"}
                </h3>
                <button onClick={() => setShowBookmarks(false)}>
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
              <div className="overflow-auto max-h-[calc(80vh-60px)] divide-y divide-border">
                {getBookmarks().length > 0 ? (
                  getBookmarks().map((bookmark) => (
                    <button
                      key={bookmark.verseKey}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        goToPage(bookmark.pageNumber);
                        setShowBookmarks(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Bookmark size={16} className="text-primary fill-primary" />
                        <div className="text-start">
                          <p className="text-sm font-medium">{bookmark.verseKey}</p>
                          <p className="text-xs text-muted-foreground">
                            {locale === "ar" ? "سورة" : "Surah"} {bookmark.chapterId} - {locale === "ar" ? "صفحة" : "Page"} {bookmark.pageNumber}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground text-sm p-8">
                    {locale === "ar" ? "لا توجد إشارات مرجعية" : "No bookmarks"}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 shadow-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Keyboard size={18} />
                  {locale === "ar" ? "اختصارات لوحة المفاتيح" : "Keyboard Shortcuts"}
                </h3>
                <button onClick={() => setShowShortcuts(false)}>
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { key: "← / →", action: locale === "ar" ? "التنقل بين الصفحات" : "Navigate pages" },
                  { key: "Space", action: locale === "ar" ? "تشغيل / إيقاف الصوت" : "Play / Pause audio" },
                  { key: "Escape", action: locale === "ar" ? "إغلاق جميع النوافذ" : "Close all panels" },
                  { key: "F", action: locale === "ar" ? "فتح البحث" : "Open search" },
                  { key: "?", action: locale === "ar" ? "عرض الاختصارات" : "Show shortcuts" },
                ].map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{shortcut.action}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verse Options Menu */}
      <VerseOptionsMenu
        position={verseMenuPosition}
        verseKey={selectedVerseForMenu?.verse_key || ""}
        verseText={selectedVerseForMenu?.text_uthmani || ""}
        onTafsir={() => {
          if (selectedVerseForMenu) {
            handleTafsir(selectedVerseForMenu.verse_key);
          }
        }}
        onPlay={() => {
          if (selectedVerseForMenu) {
            playVerse(selectedVerseForMenu.verse_key);
          }
        }}
        onCopy={handleCopyVerse}
        onShare={handleShareVerse}
        onBookmark={handleBookmarkVerse}
        isBookmarked={selectedVerseForMenu ? isBookmarked(selectedVerseForMenu.verse_key) : false}
        onClose={handleCloseVerseMenu}
      />

      {/* Tafsir Panel */}
      <TafsirPanel
        isOpen={showTafsir}
        verseKey={selectedVerse || ""}
        onClose={() => setShowTafsir(false)}
        onPlayVerse={() => {
          if (selectedVerse) {
            playVerse(selectedVerse);
          }
        }}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 ${toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
              }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "success" && <Check size={16} />}
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Display Settings */}
      <DisplaySettings
        isOpen={showDisplaySettings}
        onClose={() => setShowDisplaySettings(false)}
        fontSize={fontSize}
        setFontSize={setFontSize}
        pageWidth={pageWidth}
        setPageWidth={setPageWidth}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        selectedReciter={selectedReciter}
        setSelectedReciter={setSelectedReciter}
        pageInput={pageInput}
        setPageInput={setPageInput}
        goToPage={goToPage}
        readingMode={readingMode}
        setReadingMode={setReadingMode}
      />

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
