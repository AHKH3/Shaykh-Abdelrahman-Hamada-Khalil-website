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
  Monitor,
  Maximize2,
  Scan,
  ChevronDown,
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
  getVersesByRange,
  type Verse,
  type Chapter,
} from "@/lib/quran/api";
import { useTheme } from "@/lib/theme/context";
import VerseOptionsMenu from "./VerseOptionsMenu";
import TafsirPanel from "./TafsirPanel";
import DisplaySettings from "./DisplaySettings";
import AdvancedSearch from "./AdvancedSearch";
import FloatingVerseRangePanel from "./FloatingVerseRangePanel";
import FloatingAudioPlayer from "./FloatingAudioPlayer";
import { isBookmarked, addBookmark, removeBookmarkByVerseKey, getBookmarks } from "@/lib/quran/bookmarks";
import { copyVerseToClipboard, shareVerse } from "@/lib/quran/export";

export default function MushafViewer() {
  const { theme } = useTheme();
  const { t, locale, dir } = useI18n();
  const [currentPage, setCurrentPage] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [nextPageVerses, setNextPageVerses] = useState<Verse[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIndex, setShowIndex] = useState(false);
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
  const [selectedReciter, setSelectedReciter] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [repeatMode, setRepeatMode] = useState<"none" | "one" | "all" | "verse" | "range">("none");
  // Advanced repeat features for self-memorization
  const [verseRepeatCount, setVerseRepeatCount] = useState(3);
  const [rangeRepeatCount, setRangeRepeatCount] = useState(3);
  const [pauseBetweenVerses, setPauseBetweenVerses] = useState(2);
  const [currentVerseRepeat, setCurrentVerseRepeat] = useState(0);
  const [currentRangeRepeat, setCurrentRangeRepeat] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Refs for use inside audio callbacks (avoid stale closures)
  const audioVolumeRef = useRef(1);
  const audioSpeedRef = useRef(1);
  const repeatModeRef = useRef<"none" | "one" | "all" | "verse" | "range">("none");
  const verseRepeatCountRef = useRef(3);
  const rangeRepeatCountRef = useRef(3);
  const pauseBetweenVersesRef = useRef(2);

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
  const [readingMode, setReadingMode] = useState<"normal" | "sepia" | "green" | "purple" | "blue" | "red" | "pink" | "highContrast">("normal");
  const [screenMode, setScreenMode] = useState<"normal" | "focus" | "fullscreen">("normal");
  const [showScreenModeMenu, setShowScreenModeMenu] = useState(false);

  // Additional features
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // Verse range mode
  const [viewMode, setViewMode] = useState<"pages" | "range">("pages");
  const [showVerseRangePanel, setShowVerseRangePanel] = useState(false);
  const [rangeData, setRangeData] = useState<{
    chapterId: number;
    fromVerse: number;
    toVerse: number;
    verses: Verse[];
    chapterInfo?: Chapter;
  } | null>(null);
  const [lastPageBeforeRange, setLastPageBeforeRange] = useState(1);



  // Handle focus mode - add class to body to hide site header only in focus mode
  useEffect(() => {
    if (screenMode === "focus") {
      document.body.classList.add("mushaf-focus-mode");
    } else {
      document.body.classList.remove("mushaf-focus-mode");
    }
    return () => {
      document.body.classList.remove("mushaf-focus-mode");
    };
  }, [screenMode]);

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
      case "normal": return displayMode === "double" ? "max-w-6xl" : "max-w-3xl";
      case "wide": return displayMode === "double" ? "max-w-7xl" : "max-w-5xl";
      case "full": return "max-w-full px-6";
      default: return "max-w-3xl";
    }
  };

  const getContainerHeightClass = (mode: string) => {
    switch (mode) {
      case "focus": return "h-[100vh]";
      default: return "h-[calc(100vh-4rem)]";
    }
  };

  const getReadingModeClass = (mode: string) => {
    switch (mode) {
      case "normal": return "mushaf-reading-mode-normal";
      case "sepia": return "mushaf-reading-mode-sepia";
      case "green": return "mushaf-reading-mode-green";
      case "purple": return "mushaf-reading-mode-purple";
      case "blue": return "mushaf-reading-mode-blue";
      case "red": return "mushaf-reading-mode-red";
      case "pink": return "mushaf-reading-mode-pink";
      case "highContrast": return "mushaf-reading-mode-high-contrast";
      default: return "mushaf-reading-mode-normal";
    }
  };

  const getScreenModeClass = (mode: string) => {
    switch (mode) {
      case "focus": return ""; // Focus mode only hides site header, no internal class needed
      case "fullscreen": return "screen-mode-fullscreen";
      default: return "";
    }
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!fullscreenContainerRef.current) return;

    if (screenMode === "fullscreen") {
      document.exitFullscreen().catch(console.error);
      setScreenMode("normal");
    } else {
      fullscreenContainerRef.current.requestFullscreen().catch(console.error);
      setScreenMode("fullscreen");
    }
  };

  // Handle screen mode changes
  const handleScreenModeChange = (mode: "normal" | "focus" | "fullscreen") => {
    if (mode === "fullscreen") {
      toggleFullscreen();
    } else {
      // Exit fullscreen if currently in fullscreen mode
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
      setScreenMode(mode);
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

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && screenMode === "fullscreen") {
        setScreenMode("normal");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [screenMode]);

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

  // Verse range handlers
  const handleSelectRange = async (chapterId: number, fromVerse: number, toVerse: number) => {
    setLoading(true);
    try {
      // Save current page before switching to range mode
      setLastPageBeforeRange(currentPage);

      // Fetch verses in range
      const result = await getVersesByRange(chapterId, fromVerse, toVerse);
      const chapter = chapters.find((c) => c.id === chapterId);

      setRangeData({
        chapterId,
        fromVerse,
        toVerse,
        verses: result.verses,
        chapterInfo: chapter,
      });

      setViewMode("range");
      // Don't auto-close the panel - let user keep it open for quick adjustments
    } catch (error) {
      console.error("Failed to load verse range:", error);
      showToast(locale === "ar" ? "فشل تحميل المدى" : "Failed to load range", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPages = () => {
    setViewMode("pages");
    setRangeData(null);
    // Return to last page before range mode
    if (lastPageBeforeRange !== currentPage) {
      goToPage(lastPageBeforeRange);
    }
  };

  // Navigation mapping from search/index
  const handleNavigateFromIndex = (pageNumber: number, verseKey?: string) => {
    // If in range mode, switch back to pages first
    if (viewMode === "range") {
      setViewMode("pages");
      setRangeData(null);
    }

    goToPage(pageNumber);

    if (verseKey) {
      setHighlightedVerse(verseKey);
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedVerse(null), 3000);
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

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Audio
  const playVerse = (verseKey: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onended = null;
    }

    const [chapter, verse] = verseKey.split(":").map(Number);
    const url = getAudioUrl(selectedReciter, chapter, verse);

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.volume = audioVolumeRef.current;
    audio.playbackRate = audioSpeedRef.current;
    setCurrentAudioVerse(verseKey);
    setIsPlaying(true);
    setAudioCurrentTime(0);
    setAudioProgress(0);

    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };

    audio.ontimeupdate = () => {
      setAudioCurrentTime(audio.currentTime);
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.play().catch(console.error);
    audio.onended = () => {
      const mode = repeatModeRef.current;
      const verseRepeatCount = verseRepeatCountRef.current;
      const rangeRepeatCount = rangeRepeatCountRef.current;
      const pauseBetweenVerses = pauseBetweenVersesRef.current;

      const allVerses = viewMode === "range" && rangeData ? rangeData.verses : verses;
      const currentIndex = allVerses.findIndex((v) => v.verse_key === verseKey);

      // Handle verse repeat mode
      if (mode === "verse") {
        if (currentVerseRepeat < verseRepeatCount - 1) {
          setCurrentVerseRepeat((c) => c + 1);
          playVerse(verseKey);
          return;
        }
        setCurrentVerseRepeat(0);
      }

      // Handle single verse repeat
      if (mode === "one") {
        playVerse(verseKey);
        return;
      }

      // Move to next verse
      if (currentIndex >= 0 && currentIndex < allVerses.length - 1) {
        const nextVerse = allVerses[currentIndex + 1];
        if (pauseBetweenVerses > 0 && (mode === "verse" || mode === "range")) {
          setTimeout(() => {
            playVerse(nextVerse.verse_key);
          }, pauseBetweenVerses * 1000);
        } else {
          playVerse(nextVerse.verse_key);
        }
      } else {
        // End of range
        if (mode === "range" && currentRangeRepeat < rangeRepeatCount - 1) {
          setCurrentRangeRepeat((c) => c + 1);
          setCurrentVerseRepeat(0);
          playVerse(allVerses[0].verse_key);
        } else if (mode === "all" && allVerses.length > 0) {
          // Wrap around to the first verse
          playVerse(allVerses[0].verse_key);
        } else {
          setIsPlaying(false);
          setCurrentAudioVerse(null);
          setAudioProgress(0);
          setAudioCurrentTime(0);
          setCurrentRangeRepeat(0);
          setCurrentVerseRepeat(0);
        }
      }
    };
  };

  const playPage = () => {
    if (verses.length > 0) {
      playVerse(verses[0].verse_key);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
  };

  const resumeAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.ontimeupdate = null;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentAudioVerse(null);
    setAudioProgress(0);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setCurrentRangeRepeat(0);
    setCurrentVerseRepeat(0);
  };

  const handleNextVerse = () => {
    if (!currentAudioVerse) return;
    const allVerses = viewMode === "range" && rangeData ? rangeData.verses : verses;
    const idx = allVerses.findIndex((v) => v.verse_key === currentAudioVerse);
    if (idx >= 0 && idx < allVerses.length - 1) {
      playVerse(allVerses[idx + 1].verse_key);
    }
  };

  const handlePrevVerse = () => {
    if (!currentAudioVerse) return;
    const allVerses = viewMode === "range" && rangeData ? rangeData.verses : verses;
    const idx = allVerses.findIndex((v) => v.verse_key === currentAudioVerse);
    if (idx > 0) {
      playVerse(allVerses[idx - 1].verse_key);
    }
  };

  const handleAudioSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioCurrentTime(time);
    }
  };

  const handleSetVolume = (vol: number) => {
    audioVolumeRef.current = vol;
    setAudioVolume(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  };

  const handleSetSpeed = (speed: number) => {
    audioSpeedRef.current = speed;
    setAudioSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  const handleSetRepeatMode = (mode: "none" | "one" | "all" | "verse" | "range") => {
    repeatModeRef.current = mode;
    setRepeatMode(mode);
    // Reset counters when mode changes
    setCurrentRangeRepeat(0);
    setCurrentVerseRepeat(0);
  };

  const handleSetVerseRepeatCount = (count: number) => {
    verseRepeatCountRef.current = count;
    setVerseRepeatCount(count);
    setCurrentVerseRepeat(0);
  };

  const handleSetRangeRepeatCount = (count: number) => {
    rangeRepeatCountRef.current = count;
    setRangeRepeatCount(count);
    setCurrentRangeRepeat(0);
  };

  const handleSetPauseBetweenVerses = (seconds: number) => {
    pauseBetweenVersesRef.current = seconds;
    setPauseBetweenVerses(seconds);
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
        setShowIndex(false);
        setShowTafsir(false);
        setShowDisplaySettings(false);
        setShowBookmarks(false);
        setShowShortcuts(false);
      }
      if (e.key === "f" || e.key === "F") setShowIndex(true);
      if (e.key === "?") setShowShortcuts(true);
      if (e.key === " ") {
        e.preventDefault();
        if (showAudioPlayer && isPlaying) pauseAudio();
        else if (showAudioPlayer && !isPlaying && currentAudioVerse) resumeAudio();
        else if (showAudioPlayer && !isPlaying) playPage();
        else { setShowAudioPlayer(true); }
      }

      // Phase 3: Keyboard shortcuts for verse range panel
      // Toggle verse range panel: V or Alt+V
      if ((e.key === "v" || e.key === "V") && !e.altKey) {
        setShowVerseRangePanel(prev => !prev);
      }
      if (e.key === "V" && e.altKey) {
        e.preventDefault();
        setShowVerseRangePanel(prev => !prev);
      }

      // Focus range selection: R or Alt+R (when panel is open)
      if ((e.key === "r" || e.key === "R") && !e.altKey && showVerseRangePanel) {
        // Focus on the verse range inputs
        const fromInput = document.querySelector('input[type="number"][placeholder="1"]') as HTMLInputElement;
        const toInput = document.querySelector('input[type="number"]:not([placeholder="1"])') as HTMLInputElement;
        if (fromInput) fromInput.focus();
        else if (toInput) toInput.focus();
      }
      if (e.key === "R" && e.altKey) {
        e.preventDefault();
        const fromInput = document.querySelector('input[type="number"][placeholder="1"]') as HTMLInputElement;
        const toInput = document.querySelector('input[type="number"]:not([placeholder="1"])') as HTMLInputElement;
        if (fromInput) fromInput.focus();
        else if (toInput) toInput.focus();
      }

      // Next range: N or Alt+N (when in range mode)
      if ((e.key === "n" || e.key === "N") && !e.altKey && viewMode === "range" && rangeData) {
        const nextChapter = chapters.find(c => c.id === rangeData.chapterId + 1);
        if (nextChapter) {
          handleSelectRange(nextChapter.id, 1, Math.min(10, nextChapter.verses_count));
        }
      }
      if (e.key === "N" && e.altKey && viewMode === "range" && rangeData) {
        e.preventDefault();
        const nextChapter = chapters.find(c => c.id === rangeData.chapterId + 1);
        if (nextChapter) {
          handleSelectRange(nextChapter.id, 1, Math.min(10, nextChapter.verses_count));
        }
      }

      // Previous range: P or Alt+P (when in range mode)
      if ((e.key === "p" || e.key === "P") && !e.altKey && viewMode === "range" && rangeData) {
        const prevChapter = chapters.find(c => c.id === rangeData.chapterId - 1);
        if (prevChapter) {
          handleSelectRange(prevChapter.id, 1, Math.min(10, prevChapter.verses_count));
        }
      }
      if (e.key === "P" && e.altKey && viewMode === "range" && rangeData) {
        e.preventDefault();
        const prevChapter = chapters.find(c => c.id === rangeData.chapterId - 1);
        if (prevChapter) {
          handleSelectRange(prevChapter.id, 1, Math.min(10, prevChapter.verses_count));
        }
      }

      // Toggle memorization mode: M or Alt+M
      if ((e.key === "m" || e.key === "M") && !e.altKey) {
        // This would toggle the memorization tab
        const memButton = document.querySelector('button[title*="Memorization"]') as HTMLButtonElement;
        if (memButton) memButton.click();
      }
      if (e.key === "M" && e.altKey) {
        e.preventDefault();
        const memButton = document.querySelector('button[title*="Memorization"]') as HTMLButtonElement;
        if (memButton) memButton.click();
      }

      // Show/Hide all verses: S or Alt+S
      if ((e.key === "s" || e.key === "S") && !e.altKey && viewMode === "range") {
        // Toggle visibility of verses in range mode
        const versesContainer = document.querySelector('.quran-text');
        if (versesContainer) {
          const isHidden = versesContainer.classList.contains('verses-hidden');
          if (isHidden) {
            versesContainer.classList.remove('verses-hidden');
            versesContainer.classList.add('verses-visible');
          } else {
            versesContainer.classList.remove('verses-visible');
            versesContainer.classList.add('verses-hidden');
          }
        }
      }
      if (e.key === "S" && e.altKey && viewMode === "range") {
        e.preventDefault();
        const versesContainer = document.querySelector('.quran-text');
        if (versesContainer) {
          const isHidden = versesContainer.classList.contains('verses-hidden');
          if (isHidden) {
            versesContainer.classList.remove('verses-hidden');
            versesContainer.classList.add('verses-visible');
          } else {
            versesContainer.classList.remove('verses-visible');
            versesContainer.classList.add('verses-hidden');
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isPlaying, showAudioPlayer, currentAudioVerse, showVerseRangePanel, viewMode, rangeData, chapters]);

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
    <div
      ref={fullscreenContainerRef}
      className={`flex flex-col ${getContainerHeightClass(screenMode)} ${getReadingModeClass(readingMode)} ${getScreenModeClass(screenMode)} transition-colors duration-300`}
    >
      {/* Progress Bar */}
      <div className="mushaf-progress-bar h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(currentPage / TOTAL_PAGES) * 100}%` }}
        />
      </div>

      {/* Top Bar */}
      <div className="mushaf-top-bar flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIndex(true)}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Layers size={18} />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t.mushaf.surah}</span>
              <span className="text-sm font-bold font-['Amiri',serif]">
                {currentSurah?.name_arabic || ""}
              </span>
            </div>
            <ChevronDown size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          {viewMode === "range" && rangeData && (
            <button
              onClick={handleBackToPages}
              className="px-3 py-1.5 text-xs bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              {t.mushaf.backToPages}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowIndex(true)}
            className="p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary"
            title={t.mushaf.search}
          >
            <Search size={18} />
          </button>
          <button
            onClick={() => {
              setShowVerseRangePanel(!showVerseRangePanel);
            }}
            className={`p-2 rounded-lg transition-colors ${showVerseRangePanel ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            title={t.mushaf.verseRange}
          >
            <BookOpen size={16} />
          </button>
          <button
            onClick={() => setShowBookmarks(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={locale === "ar" ? "الإشارات المرجعية" : "Bookmarks"}
          >
            <Bookmark size={16} />
          </button>
          <button
            onClick={() => setShowAudioPlayer((v) => !v)}
            className={`p-2 rounded-lg transition-colors ${showAudioPlayer ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            title={locale === "ar" ? t.mushaf.audioPlayer : t.mushaf.audioPlayer}
          >
            <Volume2 size={16} />
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
          <div className="w-px h-6 bg-border mx-1" />
          <div className="relative">
            <button
              onClick={() => setShowScreenModeMenu(!showScreenModeMenu)}
              className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-1.5 border ${screenMode !== "normal" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/80 border-transparent text-muted-foreground"}`}
              title={t.mushaf.screenMode}
            >
              {screenMode === "focus" ? <Scan size={18} /> : screenMode === "fullscreen" ? <Maximize2 size={18} /> : <Monitor size={18} />}
              <ChevronDown size={14} className={`transition-transform duration-300 ${showScreenModeMenu ? "rotate-180" : ""}`} />
            </button>
            {showScreenModeMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowScreenModeMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute end-0 top-full mt-2 z-50 bg-card/90 backdrop-blur-xl border border-border/40 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] py-2 min-w-[180px] overflow-hidden"
                >
                  {[
                    { value: "normal" as const, label: t.mushaf.screenModeNormal, icon: <Monitor size={16} /> },
                    { value: "focus" as const, label: t.mushaf.screenModeFocus, icon: <Scan size={16} /> },
                    { value: "fullscreen" as const, label: t.mushaf.screenModeFullscreen, icon: <Maximize2 size={16} /> },
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => { handleScreenModeChange(mode.value); setShowScreenModeMenu(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:bg-primary/10 ${screenMode === mode.value ? "text-primary font-bold bg-primary/5" : "text-foreground/70"}`}
                    >
                      {mode.icon}
                      {mode.label}
                      {screenMode === mode.value && <div className="ms-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative custom-scrollbar bg-background/50" ref={scrollContainerRef}>
        <div className={`${getPageWidthClass(pageWidth)} mx-auto px-4 sm:px-8 py-10`}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : viewMode === "range" && rangeData ? (
            // Range Mode View
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-6 sm:p-10 relative overflow-hidden"
            >
              {/* Range Header */}
              <div className="text-center mb-8">
                <div className="inline-block px-8 py-3 bg-primary/10 rounded-2xl border border-primary/30">
                  <h2 className="text-xl font-bold font-['Amiri',serif] text-primary">
                    {rangeData.chapterInfo?.name_arabic || `سورة ${rangeData.chapterId}`}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {locale === "ar"
                      ? `الآيات ${rangeData.fromVerse} - ${rangeData.toVerse}`
                      : `Verses ${rangeData.fromVerse} - ${rangeData.toVerse}`}
                  </p>
                </div>

                {/* Bismillah if first verse and not Surah 1 or 9 */}
                {rangeData.fromVerse === 1 &&
                  rangeData.chapterId !== 1 &&
                  rangeData.chapterId !== 9 && (
                    <p className={`mt-6 ${getFontSizeClass(fontSize)} font-['Amiri',serif] text-muted-foreground`}>
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                    </p>
                  )}
              </div>

              {/* Range Verses */}
              <div className={`quran-text text-center leading-[2.5] ${getFontSizeClass(fontSize)}`} dir="rtl">
                {rangeData.verses.map((verse) => (
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
                      className={`inline-flex items-center justify-center ${getFontSizeClass(fontSize)} text-muted-foreground font-sans mx-1 min-w-[1.5rem] hover:bg-muted/50 rounded cursor-pointer`}
                      onClick={(e) => handleVerseNumberClick(verse, e)}
                    >
                      ۝{verse.verse_number.toLocaleString("ar-EG")}
                    </span>{" "}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            // Normal Pages Mode
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: locale === "ar" ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Mushaf Page Frame */}
              <div className={`relative ${displayMode === 'double' ? 'bg-transparent border-none' : 'bg-card shadow-[0_10px_50px_-15px_rgba(0,0,0,0.1)] border border-border/40 rounded-3xl p-8 sm:p-12'} overflow-hidden`}>
                {/* Pages View */}
                {displayMode === 'double' ? (
                  <div className="grid grid-cols-2 gap-0.5 bg-border/20 rounded-3xl overflow-hidden shadow-[0_20px_70px_-20px_rgba(0,0,0,0.2)] border border-border/30 relative">
                    {/* Center Spine */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 z-10 pointer-events-none bg-gradient-to-r from-transparent via-black/[0.07] to-transparent" />
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px z-10 pointer-events-none bg-border/30" />

                    {/* Left Page (Standard Mushaf: Left is even Page) */}
                    <div className="bg-card p-10 sm:p-16 relative overflow-hidden group">
                      {/* Inner Shadow for depth near spine */}
                      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/[0.03] to-transparent pointer-events-none" />

                      {/* Page Header */}
                      <div className="flex items-center justify-between mb-8 opacity-40 hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t.mushaf.juz} {currentJuz}</span>
                        <span className="text-[10px] font-bold">{currentPage}</span>
                      </div>

                      <div className={`quran-text text-center leading-[2.8] ${getFontSizeClass(fontSize)}`} dir="rtl">
                        {groupedVerses.map((group, gi) => (
                          <div key={gi}>
                            {group.verses[0].verse_number === 1 && (
                              <div className="my-10 text-center">
                                <div className="inline-block px-14 py-4 bg-primary/5 rounded-2xl border border-primary/10 shadow-inner">
                                  <h3 className="text-2xl font-bold font-['Amiri',serif] text-foreground">
                                    {group.chapterName}
                                  </h3>
                                </div>
                                {group.chapterId !== 9 && group.chapterId !== 1 && (
                                  <p className="mt-6 text-2xl font-['Amiri',serif] text-muted-foreground/80">
                                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                                  </p>
                                )}
                              </div>
                            )}

                            {group.verses.map((verse) => (
                              <span
                                key={verse.verse_key}
                                className={`cursor-pointer transition-all inline relative px-0.5 rounded ${currentAudioVerse === verse.verse_key
                                  ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                                  : highlightedVerse === verse.verse_key
                                    ? "bg-yellow-400/20 text-amber-900 dark:text-amber-100 ring-2 ring-yellow-400/30"
                                    : "hover:bg-primary/5"
                                  }`}
                                onClick={() => handleVerseClick(verse.verse_key)}
                              >
                                {verse.text_uthmani}{" "}
                                <span
                                  className="inline-flex items-center justify-center text-muted-foreground/60 font-sans mx-1.5 transition-colors hover:text-primary"
                                  onClick={(e) => handleVerseNumberClick(verse, e)}
                                >
                                  ۝{verse.verse_number.toLocaleString("ar-EG")}
                                </span>{" "}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Page (Next Page) */}
                    <div className="bg-card p-10 sm:p-16 relative overflow-hidden group border-s border-border/10">
                      {/* Inner Shadow for depth near spine */}
                      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/[0.03] to-transparent pointer-events-none" />

                      {/* Page Header */}
                      <div className="flex items-center justify-between mb-8 opacity-40 hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold">{currentPage + 1}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {nextPageVerses.length > 0 ? (chapters.find(c => c.id === nextPageVerses[0].chapter_id)?.name_arabic || "") : ""}
                        </span>
                      </div>

                      {nextPageVerses.length > 0 ? (
                        <div className={`quran-text text-center leading-[2.8] ${getFontSizeClass(fontSize)}`} dir="rtl">
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
                                {group.verses[0].verse_number === 1 && (
                                  <div className="my-10 text-center">
                                    <div className="inline-block px-14 py-4 bg-primary/5 rounded-2xl border border-primary/10">
                                      <h3 className="text-2xl font-bold font-['Amiri',serif]">{group.chapterName}</h3>
                                    </div>
                                    {group.chapterId !== 9 && group.chapterId !== 1 && (
                                      <p className="mt-6 text-2xl font-['Amiri',serif] text-muted-foreground/80">
                                        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                                      </p>
                                    )}
                                  </div>
                                )}
                                {group.verses.map((verse) => (
                                  <span
                                    key={verse.verse_key}
                                    className={`cursor-pointer transition-all inline relative px-0.5 rounded ${currentAudioVerse === verse.verse_key
                                      ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                                      : highlightedVerse === verse.verse_key
                                        ? "bg-yellow-400/20 text-amber-900 dark:text-amber-100 ring-2 ring-yellow-400/30"
                                        : "hover:bg-primary/5"
                                      }`}
                                    onClick={() => handleVerseClick(verse.verse_key)}
                                  >
                                    {verse.text_uthmani}{" "}
                                    <span
                                      className="inline-flex items-center justify-center text-muted-foreground/60 font-sans mx-1.5 transition-colors hover:text-primary"
                                      onClick={(e) => handleVerseNumberClick(verse, e)}
                                    >
                                      ۝{verse.verse_number.toLocaleString("ar-EG")}
                                    </span>{" "}
                                  </span>
                                ))}
                              </div>
                            ));
                          })()}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm">
                          {locale === "ar" ? "نهاية المصحف" : "End of Mushaf"}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-10 opacity-40 hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold uppercase tracking-widest">{t.mushaf.juz} {currentJuz}</span>
                      <span className="text-xs font-bold">{currentPage}</span>
                    </div>

                    <div className={`quran-text text-center leading-[2.8] ${getFontSizeClass(fontSize)}`} dir="rtl">
                      {groupedVerses.map((group, gi) => (
                        <div key={gi}>
                          {group.verses[0].verse_number === 1 && (
                            <div className="my-10 text-center">
                              <div className="inline-block px-16 py-5 bg-primary/5 rounded-3xl border border-primary/10 shadow-sm">
                                <h3 className="text-3xl font-bold font-['Amiri',serif] text-foreground">
                                  {group.chapterName}
                                </h3>
                              </div>
                              {group.chapterId !== 9 && group.chapterId !== 1 && (
                                <p className="mt-8 text-2xl font-['Amiri',serif] text-muted-foreground/80">
                                  بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                                </p>
                              )}
                            </div>
                          )}

                          {group.verses.map((verse) => (
                            <span
                              key={verse.verse_key}
                              className={`cursor-pointer transition-all inline relative px-0.5 rounded-lg ${currentAudioVerse === verse.verse_key
                                ? "bg-primary/20 text-primary ring-4 ring-primary/10"
                                : highlightedVerse === verse.verse_key
                                  ? "bg-yellow-400/20 text-amber-900 dark:text-amber-100 ring-4 ring-yellow-400/10"
                                  : "hover:bg-primary/5"
                                }`}
                              onClick={() => handleVerseClick(verse.verse_key)}
                            >
                              {verse.text_uthmani}{" "}
                              <span
                                className="inline-flex items-center justify-center text-muted-foreground/50 font-sans mx-2 transition-colors hover:text-primary scale-110"
                                onClick={(e) => handleVerseNumberClick(verse, e)}
                              >
                                ۝{verse.verse_number.toLocaleString("ar-EG")}
                              </span>{" "}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>

      </div>

      {/* Bottom Navigation - Hide in range mode */}
      {viewMode === "pages" && (
        <div className="mushaf-bottom-nav flex items-center justify-center gap-6 px-6 py-4 bg-card/80 backdrop-blur-xl border-t border-border/40 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="flex items-center gap-3 px-7 py-3 text-sm font-black bg-muted/40 backdrop-blur-md hover:bg-primary hover:text-white rounded-2xl transition-all duration-300 disabled:opacity-10 disabled:cursor-not-allowed group shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(var(--color-primary),0.3)] border border-border/30 hover:border-primary/50"
          >
            <SkipForward size={18} className="transition-transform group-hover:scale-110 group-active:-translate-x-0.5" />
            <span>{t.mushaf.prevPage}</span>
          </button>

          <div className="flex flex-col items-center">
            <div className="relative px-5 py-2 rounded-xl bg-background border border-border/40 shadow-inner flex items-center gap-2 group cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-primary relative z-10">{currentPage}</span>
              <span className="text-xs text-muted-foreground/60 relative z-10">/</span>
              <span className="text-sm font-bold text-muted-foreground relative z-10">{TOTAL_PAGES}</span>
            </div>
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage >= TOTAL_PAGES}
            className="flex items-center gap-3 px-7 py-3 text-sm font-black bg-muted/40 backdrop-blur-md hover:bg-primary hover:text-white rounded-2xl transition-all duration-300 disabled:opacity-10 disabled:cursor-not-allowed group shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(var(--color-primary),0.3)] border border-border/30 hover:border-primary/50"
          >
            <span>{t.mushaf.nextPage}</span>
            <SkipBack size={18} className="transition-transform group-hover:scale-110 group-active:translate-x-0.5" />
          </button>
        </div>
      )}

      {/* Unified Index & Search Panel */}
      <AdvancedSearch
        isOpen={showIndex}
        onClose={() => setShowIndex(false)}
        chapters={chapters}
        onNavigate={handleNavigateFromIndex}
      />

      {/* Floating Verse Range Panel */}
      <FloatingVerseRangePanel
        isOpen={showVerseRangePanel}
        onClose={() => setShowVerseRangePanel(false)}
        chapters={chapters}
        onSelectRange={handleSelectRange}
        initialChapterId={rangeData?.chapterId}
        initialFromVerse={rangeData?.fromVerse}
        initialToVerse={rangeData?.toVerse}
      />

      {/* Floating Audio Player */}
      <FloatingAudioPlayer
        isOpen={showAudioPlayer}
        onClose={() => {
          setShowAudioPlayer(false);
          stopAudio();
        }}
        verseRepeatCount={verseRepeatCount}
        onSetVerseRepeatCount={handleSetVerseRepeatCount}
        rangeRepeatCount={rangeRepeatCount}
        onSetRangeRepeatCount={handleSetRangeRepeatCount}
        pauseBetweenVerses={pauseBetweenVerses}
        onSetPauseBetweenVerses={handleSetPauseBetweenVerses}
        isPlaying={isPlaying}
        currentVerseKey={currentAudioVerse}
        currentVerseText={
          currentAudioVerse
            ? (viewMode === "range" && rangeData ? rangeData.verses : verses).find(
              (v) => v.verse_key === currentAudioVerse
            )?.text_uthmani
            : undefined
        }
        selectedReciter={selectedReciter}
        onSetReciter={(id) => {
          setSelectedReciter(id);
          if (currentAudioVerse) playVerse(currentAudioVerse);
        }}
        onPlay={playPage}
        onPause={pauseAudio}
        onNextVerse={handleNextVerse}
        onPrevVerse={handlePrevVerse}
        audioProgress={audioProgress}
        audioDuration={audioDuration}
        audioCurrentTime={audioCurrentTime}
        onSeek={handleAudioSeek}
        audioVolume={audioVolume}
        onSetVolume={handleSetVolume}
        audioSpeed={audioSpeed}
        onSetSpeed={handleSetSpeed}
        repeatMode={repeatMode}
        onSetRepeatMode={handleSetRepeatMode}
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

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] text-sm font-bold z-[100] backdrop-blur-xl border ${toast.type === "success"
              ? "bg-green-500/90 text-white border-green-400/30"
              : "bg-red-500/90 text-white border-red-400/30"
              }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" ? <Check size={20} className="animate-in zoom-in duration-300" /> : <X size={20} className="animate-in zoom-in duration-300" />}
              <span className="tracking-tight">{toast.message}</span>
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
