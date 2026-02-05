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
  type Verse,
  type Chapter,
} from "@/lib/quran/api";

export default function MushafViewer() {
  const { t, locale, dir } = useI18n();
  const [currentPage, setCurrentPage] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
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
  const [showSettings, setShowSettings] = useState(false);
  const [pageInput, setPageInput] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Audio
  const playVerse = (verseKey: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const [chapter, verse] = verseKey.split(":").map(Number);
    const paddedChapter = chapter.toString().padStart(3, "0");
    const paddedVerse = verse.toString().padStart(3, "0");
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${paddedChapter}${paddedVerse}.mp3`;

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
        setShowSettings(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
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
          <span className="text-xs text-muted-foreground">
            {t.mushaf.page} {currentPage} | {t.mushaf.juz} {currentJuz || "-"}
          </span>
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
            onClick={isPlaying ? stopAudio : playPage}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={isPlaying ? t.mushaf.pause : t.mushaf.audio}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={t.mushaf.reciter}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-card border-b border-border"
          >
            <div className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Volume2 size={14} className="text-muted-foreground" />
                  <label className="text-xs text-muted-foreground">
                    {t.mushaf.reciter}:
                  </label>
                  <select
                    value={selectedReciter}
                    onChange={(e) => setSelectedReciter(Number(e.target.value))}
                    className="text-sm bg-muted border border-border rounded-lg px-2 py-1"
                  >
                    {RECITERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {locale === "ar" ? r.name : r.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-muted-foreground" />
                  <label className="text-xs text-muted-foreground">
                    {t.mushaf.goToPage}:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={TOTAL_PAGES}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        goToPage(Number(pageInput));
                        setPageInput("");
                        setShowSettings(false);
                      }
                    }}
                    className="w-20 text-sm bg-muted border border-border rounded-lg px-2 py-1 text-center"
                    dir="ltr"
                    placeholder="1-604"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div
              key={currentPage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Mushaf Page Frame */}
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-10 shadow-sm">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">
                    {t.mushaf.juz} {currentJuz}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.mushaf.page} {currentPage}
                  </span>
                </div>

                {/* Verses */}
                <div className="quran-text text-center leading-[2.5]" dir="rtl">
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
                          className={`cursor-pointer transition-colors inline ${
                            currentAudioVerse === verse.verse_key
                              ? "verse-highlight"
                              : "hover:text-foreground/70"
                          }`}
                          onClick={() => handleTafsir(verse.verse_key)}
                        >
                          {verse.text_uthmani}{" "}
                          <span className="inline-flex items-center justify-center text-xs text-muted-foreground font-sans mx-1 min-w-[1.5rem]">
                            ﴿{verse.verse_number.toLocaleString("ar-EG")}﴾
                          </span>{" "}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Page Footer */}
                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    {currentPage}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={dir === "rtl" ? prevPage : nextPage}
          disabled={dir === "rtl" ? currentPage <= 1 : currentPage >= TOTAL_PAGES}
          className="fixed start-2 top-1/2 -translate-y-1/2 p-3 bg-card border border-border rounded-full shadow-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={dir === "rtl" ? nextPage : prevPage}
          disabled={dir === "rtl" ? currentPage >= TOTAL_PAGES : currentPage <= 1}
          className="fixed end-2 top-1/2 -translate-y-1/2 p-3 bg-card border border-border rounded-full shadow-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
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
              className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden"
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
              className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden max-h-[80vh]"
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
              className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-lg mx-0 sm:mx-4 shadow-2xl overflow-hidden max-h-[70vh]"
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

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
