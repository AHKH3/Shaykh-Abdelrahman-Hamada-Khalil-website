"use client";

import { useState, useEffect, useCallback, useEffectEvent, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  Settings,
  Layers,
  Bookmark,
  Scroll,
  Monitor,
  Maximize2,
  Scan,
  ChevronDown,
  Highlighter,
  Eraser,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  Trash2,
  MessageSquare,
  User,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import {
  getVersesByPage,
  getChapters,
  TOTAL_PAGES,
  getAudioUrl,
  getVersesByRange,
  DEFAULT_ARABIC_TAFSIR_ID,
  DEFAULT_ENGLISH_TAFSIR_ID,
  type Verse,
  type Chapter,
} from "@/lib/quran/api";
import VerseOptionsMenu from "./VerseOptionsMenu";
import DisplaySettings from "./DisplaySettings";
import AdvancedSearch from "./AdvancedSearch";
import FloatingVerseRangePanel from "./FloatingVerseRangePanel";
import FloatingAudioPlayer from "./FloatingAudioPlayer";
import MushafPageView from "./MushafPageView";
import MushafPageFrame from "./MushafPageFrame";
import { isBookmarked, addBookmark, removeBookmarkByVerseKey } from "@/lib/quran/bookmarks";
import { copyVerseToClipboard, shareVerse } from "@/lib/quran/export";
import { ToastContainer, type ToastType } from "@/components/ui/Toast";
import BookmarksPanel from "./BookmarksPanel";
import MushafButton from "./ui/MushafButton";
import MushafPageFlipButton from "./ui/MushafPageFlipButton";
import {
  resolveFollowCandidate,
  useTafsirWorkspace,
  type TafsirScope,
} from "@/lib/hooks/useTafsirWorkspace";
import { resolveVerseKeysFromVerses } from "@/lib/quran/tafsir-service";
import TafsirDockedSidebar from "./tafsir/TafsirDockedSidebar";
import TafsirBottomSheet from "./tafsir/TafsirBottomSheet";
import TafsirPanelIcon from "./tafsir/TafsirPanelIcon";
import { useStudentAnnotations } from "@/lib/hooks/useStudentAnnotations";
import { createClient } from "@/lib/supabase/client";
import ModalShell from "@/components/ui/ModalShell";
import MushafCloseButton from "@/components/mushaf/ui/MushafCloseButton";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

const PRELOAD_RADIUS = 2;
const PAGE_CACHE_LIMIT = 15;
type ReadingMode = "normal" | "sepia" | "green" | "purple" | "blue" | "red" | "pink" | "highContrast";
type PageWidth = "normal" | "wide" | "full";

interface DisplaySettingsState {
  fontSize: number;
  pageWidth: PageWidth;
  readingMode: ReadingMode;
}

const DISPLAY_SETTINGS_STORAGE_KEY = "mushaf_display_settings_v1";
const LAST_OPEN_PAGE_STORAGE_KEY = "mushaf_last_open_page_v1";
const TAFSIR_SIDEBAR_WIDTH_STORAGE_KEY = "mushaf_tafsir_sidebar_width_v1";
const DEFAULT_DISPLAY_SETTINGS: DisplaySettingsState = {
  fontSize: 32,
  pageWidth: "normal",
  readingMode: "normal",
};

function isValidFontSize(value: unknown): value is number {
  return typeof value === "number" && [24, 32, 40, 48].includes(value);
}

function isValidPageWidth(value: unknown): value is PageWidth {
  return value === "normal" || value === "wide" || value === "full";
}

function isValidReadingMode(value: unknown): value is ReadingMode {
  return value === "normal" || value === "sepia" || value === "green" || value === "purple" || value === "blue" || value === "red" || value === "pink" || value === "highContrast";
}

function parseStoredPage(raw: string | null): number | null {
  if (!raw) return null;
  const page = Number(raw);
  if (!Number.isInteger(page) || page < 1 || page > TOTAL_PAGES) return null;
  return page;
}

function parseStoredDisplaySettings(raw: string | null): DisplaySettingsState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DisplaySettingsState>;
    return {
      fontSize: isValidFontSize(parsed.fontSize) ? parsed.fontSize : DEFAULT_DISPLAY_SETTINGS.fontSize,
      pageWidth: isValidPageWidth(parsed.pageWidth) ? parsed.pageWidth : DEFAULT_DISPLAY_SETTINGS.pageWidth,
      readingMode: isValidReadingMode(parsed.readingMode) ? parsed.readingMode : DEFAULT_DISPLAY_SETTINGS.readingMode,
    };
  } catch {
    return null;
  }
}

interface MushafViewerProps {
  /** When provided, enables student mode (annotations, export, share link) */
  studentId?: string;
  /** When true (public share link), student features are visible but read-only */
  readOnly?: boolean;
}

export default function MushafViewer({ studentId, readOnly = false }: MushafViewerProps = {}) {
  const { t, locale } = useI18n();
  const [currentPage, setCurrentPage] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [showIndex, setShowIndex] = useState(false);
  const [selectedVerseForTafsir, setSelectedVerseForTafsir] = useState<string | null>(null);
  const [highlightedVerse, setHighlightedVerse] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioVerse, setCurrentAudioVerse] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window === "undefined" ? 1440 : window.innerWidth
  );
  const [selectedTafsirId, setSelectedTafsirId] = useState<number>(
    locale === "ar" ? DEFAULT_ARABIC_TAFSIR_ID : DEFAULT_ENGLISH_TAFSIR_ID
  );
  const [tafsirSidebarWidth, setTafsirSidebarWidth] = useState(400);
  const [selectedReciter, setSelectedReciter] = useState(1);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
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
  const verseRepeatCountRef = useRef(1);
  const rangeRepeatCountRef = useRef(1);
  const pauseBetweenVersesRef = useRef(0);

  // Mutable refs for tracking current state without closure issues
  const currentVersesRef = useRef<Verse[]>(verses);
  const currentViewModeRef = useRef<"pages" | "range">("pages");
  const currentRangeDataRef = useRef<any>(null);

  useEffect(() => { currentVersesRef.current = verses; }, [verses]);

  // Verse options menu
  const [verseMenuPosition, setVerseMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedVerseForMenu, setSelectedVerseForMenu] = useState<Verse | null>(null);

  // Toast notification
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);

  // Display settings
  const [displaySettings, setDisplaySettings] = useState<DisplaySettingsState>({ ...DEFAULT_DISPLAY_SETTINGS });
  const [displaySettingsReady, setDisplaySettingsReady] = useState(false);
  const [lastPageReady, setLastPageReady] = useState(false);
  const { fontSize, pageWidth, readingMode } = displaySettings;
  const setFontSize = useCallback((size: number) => {
    setDisplaySettings((prev) => (prev.fontSize === size ? prev : { ...prev, fontSize: size }));
  }, []);
  const setPageWidth = useCallback((width: PageWidth) => {
    setDisplaySettings((prev) => (prev.pageWidth === width ? prev : { ...prev, pageWidth: width }));
  }, []);
  const setReadingMode = useCallback((mode: ReadingMode) => {
    setDisplaySettings((prev) => (prev.readingMode === mode ? prev : { ...prev, readingMode: mode }));
  }, []);
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [screenMode, setScreenMode] = useState<"normal" | "focus" | "fullscreen">("normal");
  const [showScreenModeMenu, setShowScreenModeMenu] = useState(false);

  // Additional features
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const screenModeMenuRef = useRef<HTMLDivElement>(null);

  // Scroll handling for smart header
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);

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

  useEffect(() => { currentViewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { currentRangeDataRef.current = rangeData; }, [rangeData]);
  const [lastPageBeforeRange, setLastPageBeforeRange] = useState(1);
  // Cache stored in ref only — no state needed, avoids unnecessary re-renders
  const pageVersesCacheRef = useRef<Record<number, Verse[]>>({});
  const pageCacheOrderRef = useRef<number[]>([]); // LRU order tracking
  const activePageRequestIdRef = useRef(0);
  const requestedPageRef = useRef(1);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingVerseFocus, setPendingVerseFocus] = useState<{
    verseKey: string;
    fallbackTried: boolean;
  } | null>(null);

  // Memoize sources object so useTafsirWorkspace doesn't recompute on every render
  const tafsirSources = useMemo(() => ({
    currentAudioVerse,
    highlightedVerse,
    selectedVerse: selectedVerseForTafsir,
  }), [currentAudioVerse, highlightedVerse, selectedVerseForTafsir]);

  const tafsirWorkspace = useTafsirWorkspace(tafsirSources);
  const {
    isOpen: isTafsirOpen,
    scopeMode: tafsirScopeMode,
    followMode: tafsirFollowMode,
    activeAyahVerseKey,
    openForAyah,
    close: closeTafsir,
    toggleOpen: toggleTafsirOpen,
    setScopeMode: setTafsirScopeMode,
    toggleFollowMode: toggleTafsirFollowMode,
  } = tafsirWorkspace;

  const isDockedTafsirLayout = viewportWidth >= 1024;
  const isMobileTafsirSheet = viewportWidth < 1024;
  const activeDisplayVerseKey = useMemo(
    () =>
      resolveFollowCandidate({
        currentAudioVerse,
        highlightedVerse,
        selectedVerse: selectedVerseForTafsir,
      }),
    [currentAudioVerse, highlightedVerse, selectedVerseForTafsir]
  );

  // --- Student Mode Features ---
  const mushafRef = useRef<HTMLDivElement>(null);
  const [studentName, setStudentName] = useState<string>("");
  const { annotations, addAnnotation, deleteAnnotation, clearTemporaryAnnotations } = useStudentAnnotations(studentId, currentPage);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [newAnnotationComment, setNewAnnotationComment] = useState("");
  const [isTemporaryAnnotation, setIsTemporaryAnnotation] = useState(false);
  
  const [selectionRange, setSelectionRange] = useState<{
    verseKey: string;
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);

  useEffect(() => {
    if (studentId) {
      const fetchStudent = async () => {
        const supabase = createClient();
        const { data } = await supabase.from("students").select("name").eq("id", studentId).single();
        if (data) setStudentName(data.name);
      };
      fetchStudent();
    }
  }, [studentId]);

  const handleMouseUpSelection = useCallback(() => {
    if (readOnly || !studentId) return;

    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      const verseElement = (container.nodeType === 3 ? container.parentElement : container) as HTMLElement;
      const closestVerse = verseElement.closest('[data-verse-key]');
      if (!closestVerse) return;

      const verseKey = closestVerse.getAttribute('data-verse-key');
      if (!verseKey) return;

      // Ensure we only select from the main verse text span, not the verse number
      const verseSpan = closestVerse.querySelector('span:first-child');
      if (!verseSpan || !verseSpan.contains(container)) return;

      const fullVerseText = verseSpan.textContent || "";
      const selectedText = selection.toString();

      let preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(verseSpan);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preSelectionRange.toString().length;
      const endOffset = startOffset + selectedText.length;

      setSelectionRange({
        verseKey,
        text: selectedText,
        startOffset,
        endOffset
      });
      
      const rect = range.getBoundingClientRect();
      // Show custom popup for creating annotation instead of VerseOptionsMenu
      setVerseMenuPosition({ x: rect.left + rect.width / 2, y: rect.bottom + window.scrollY + 10 });
    }, 10);
  }, [readOnly, studentId]);

  const renderVerseWithAnnotations = (verse: Verse, activeKey: string | null) => {
    const verseAnnotations = annotations.filter(a => a.verse_key === verse.verse_key);
    if (!verseAnnotations.length) {
      return (
        <span className={activeKey === verse.verse_key ? "drop-shadow-sm" : ""}>{verse.text_uthmani}</span>
      );
    }

    // Sort by start_offset
    const sorted = [...verseAnnotations].sort((a, b) => a.start_offset - b.start_offset);
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    sorted.forEach((ann, idx) => {
      if (ann.start_offset > currentIndex) {
        elements.push(
          <span key={`text-${idx}`}>{verse.text_uthmani.slice(currentIndex, ann.start_offset)}</span>
        );
      }
      elements.push(
        <span 
          key={`ann-${ann.id}`}
          className={`relative group inline-block ${ann.is_temporary ? 'bg-yellow-400/30 dark:bg-yellow-400/40 text-yellow-900 dark:text-yellow-100' : 'bg-red-400/30 dark:bg-red-400/40 text-red-900 dark:text-red-100'} rounded-[0.2em] px-0.5 mx-0.5`}
        >
          {verse.text_uthmani.slice(ann.start_offset, ann.end_offset)}
          {ann.comment && (
            <span className="absolute bottom-full start-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-popover text-popover-foreground text-xs p-2 rounded shadow-xl whitespace-nowrap z-50 border border-border">
              {ann.comment}
            </span>
          )}
          {!readOnly && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteAnnotation(ann.id);
              }}
              className="absolute -top-3 -end-3 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-5 h-5 shadow-sm"
              style={{ zIndex: 60 }}
              title={locale === "ar" ? "حذف الملاحظة" : "Delete Annotation"}
              aria-label={locale === "ar" ? "حذف الملاحظة" : "Delete Annotation"}
            >
              <Trash2 size={12} strokeWidth={3} />
            </button>
          )}
        </span>
      );
      currentIndex = Math.max(currentIndex, ann.end_offset);
    });

    if (currentIndex < verse.text_uthmani.length) {
      elements.push(
        <span key="text-end">{verse.text_uthmani.slice(currentIndex)}</span>
      );
    }

    return (
      <span className={activeKey === verse.verse_key ? "drop-shadow-sm" : ""}>
        {elements}
      </span>
    );
  };

  const exportAsImage = async () => {
    if (!mushafRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(mushafRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `${studentName || "mushaf"}-page-${currentPage}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      // Fallback or silently fail to avoid crashing the app
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!mushafRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(mushafRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${studentName || "mushaf"}-page-${currentPage}.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const copyShareLink = async () => {
    if (!studentId) return;
    const shareUrl = `${window.location.origin}/mushaf/share/${studentId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToasts(prev => [...prev, { id: Date.now().toString(), message: locale === "ar" ? "تم نسخ الرابط" : "Link copied", type: "success" }]);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // --- End Student Features ---

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = parseStoredDisplaySettings(window.localStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY));
    if (stored) {
      setDisplaySettings(stored);
    }
    setDisplaySettingsReady(true);
  }, []);

  useEffect(() => {
    if (!displaySettingsReady || typeof window === "undefined") return;
    window.localStorage.setItem(DISPLAY_SETTINGS_STORAGE_KEY, JSON.stringify(displaySettings));
  }, [displaySettings, displaySettingsReady]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(TAFSIR_SIDEBAR_WIDTH_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed)) {
      setTafsirSidebarWidth(Math.max(360, Math.min(520, parsed)));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TAFSIR_SIDEBAR_WIDTH_STORAGE_KEY, String(tafsirSidebarWidth));
  }, [tafsirSidebarWidth]);

  useEffect(() => {
    setSelectedTafsirId((current) => {
      if (locale === "ar" && current !== 169 && current !== 14 && current !== 15 && current !== 16 && current !== 90 && current !== 91 && current !== 93 && current !== 94) {
        return DEFAULT_ARABIC_TAFSIR_ID;
      }
      if (locale !== "ar" && current !== 168 && current !== 817) {
        return DEFAULT_ENGLISH_TAFSIR_ID;
      }
      return current;
    });
  }, [locale]);

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

  const mergeCache = useCallback((entries: Record<number, Verse[]>) => {
    const newKeys = Object.keys(entries);
    if (newKeys.length === 0) return pageVersesCacheRef.current;

    const cache = pageVersesCacheRef.current;
    const order = pageCacheOrderRef.current;

    // Add new entries and track order for LRU eviction
    for (const key of newKeys) {
      const pageNum = Number(key);
      cache[pageNum] = entries[pageNum];
      // Move to end of order (most recently used)
      const existingIdx = order.indexOf(pageNum);
      if (existingIdx !== -1) order.splice(existingIdx, 1);
      order.push(pageNum);
    }

    // Evict oldest pages when cache exceeds limit
    while (order.length > PAGE_CACHE_LIMIT) {
      const evicted = order.shift();
      if (evicted !== undefined) delete cache[evicted];
    }

    return cache;
  }, []);

  const fetchMissingPages = useCallback(async (pages: number[]) => {
    const uniquePages = Array.from(new Set(pages)).filter(
      (pageNumber) =>
        pageNumber >= 1 &&
        pageNumber <= TOTAL_PAGES &&
        !pageVersesCacheRef.current[pageNumber]
    );

    if (uniquePages.length === 0) return {};

    const fetchResults = await Promise.allSettled(
      uniquePages.map(async (pageNumber) => {
        const data = await getVersesByPage(pageNumber);
        return { pageNumber, verses: data.verses };
      })
    );

    const cacheUpdate: Record<number, Verse[]> = {};
    fetchResults.forEach((result) => {
      if (result.status === "fulfilled") {
        cacheUpdate[result.value.pageNumber] = result.value.verses;
      }
    });

    return cacheUpdate;
  }, []);

  const preloadNearbyPages = useCallback(async (centerPage: number) => {
    const nearbyPages: number[] = [];

    for (let offset = -PRELOAD_RADIUS; offset <= PRELOAD_RADIUS; offset += 1) {
      if (offset === 0) continue;
      const pageNumber = centerPage + offset;
      if (pageNumber >= 1 && pageNumber <= TOTAL_PAGES) {
        nearbyPages.push(pageNumber);
      }
    }

    const cacheUpdate = await fetchMissingPages(nearbyPages);
    mergeCache(cacheUpdate);
  }, [fetchMissingPages, mergeCache]);

  // Cache-first navigation: keep current page visible until target data is ready.
  const loadPage = useCallback(async (page: number) => {
    if (page < 1 || page > TOTAL_PAGES) return;

    requestedPageRef.current = page;
    const requestId = ++activePageRequestIdRef.current;
    const cachedPage = pageVersesCacheRef.current[page];

    if (cachedPage) {
      setCurrentPage(page);
      setVerses(cachedPage);
      setSelectedVerseForTafsir(null);
      void preloadNearbyPages(page);
      return;
    }

    try {
      const requiredPages = page < TOTAL_PAGES ? [page, page + 1] : [page];
      const requiredUpdate = await fetchMissingPages(requiredPages);
      const mergedCache = mergeCache(requiredUpdate);

      if (requestId !== activePageRequestIdRef.current || requestedPageRef.current !== page) {
        return;
      }

      setCurrentPage(page);
      setVerses(mergedCache[page] || []);
      setSelectedVerseForTafsir(null);
      void preloadNearbyPages(page);
    } catch (err) {
      console.error("Failed to load page:", err);
    }
  }, [fetchMissingPages, mergeCache, preloadNearbyPages]);

  useEffect(() => {
    let active = true;
    const storedPage =
      typeof window === "undefined"
        ? null
        : parseStoredPage(window.localStorage.getItem(LAST_OPEN_PAGE_STORAGE_KEY));

    void (async () => {
      await loadPage(storedPage ?? 1);
      if (active) {
        setLastPageReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [loadPage]);

  useEffect(() => {
    if (!lastPageReady || typeof window === "undefined") return;
    window.localStorage.setItem(LAST_OPEN_PAGE_STORAGE_KEY, String(currentPage));
  }, [currentPage, lastPageReady]);

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

  const goToPage = useCallback((page: number) => {
    void loadPage(page);
  }, [loadPage]);

  const pageStep = 1;
  const nextPage = useCallback(() => goToPage(requestedPageRef.current + pageStep), [pageStep, goToPage]);
  const prevPage = useCallback(() => goToPage(requestedPageRef.current - pageStep), [pageStep, goToPage]);

  const applyTemporaryHighlight = useCallback((verseKey: string, duration = 4000) => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    setHighlightedVerse(verseKey);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedVerse((prev) => (prev === verseKey ? null : prev));
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  // Get current surah info
  const getCurrentSurah = () => {
    if (verses.length === 0) return null;
    const chapterId = verses[0].chapter_id;
    return chapters.find((c) => c.id === chapterId);
  };

  const openTafsirForVerse = useCallback((verseKey: string, lockToVerse = true) => {
    setSelectedVerseForTafsir(verseKey);
    openForAyah(verseKey, { lockToVerse });
  }, [openForAyah]);

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

  const handleCloseVerseRange = () => {
    setShowVerseRangePanel(false);
    if (viewMode === "range") {
      handleBackToPages();
    }
  };

  // Navigation mapping from search/index
  const handleNavigateFromIndex = useCallback((pageNumber: number, verseKey?: string) => {
    if (viewMode === "range") {
      setViewMode("pages");
      setRangeData(null);
    }

    goToPage(pageNumber);
    if (verseKey) {
      setSelectedVerseForTafsir(verseKey);
      setPendingVerseFocus({ verseKey, fallbackTried: false });
    }
  }, [goToPage, viewMode]);

  const handleNavigateToBookmark = useCallback((pageNumber: number, verseKey: string) => {
    handleNavigateFromIndex(pageNumber, verseKey);
  }, [handleNavigateFromIndex]);

  useEffect(() => {
    if (!pendingVerseFocus) return;

    const frameId = window.requestAnimationFrame(() => {
      const selector = `[data-verse-key=\"${pendingVerseFocus.verseKey}\"]`;
      const verseElement = document.querySelector(selector) as HTMLElement | null;

      if (verseElement) {
        verseElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        applyTemporaryHighlight(pendingVerseFocus.verseKey);
        setPendingVerseFocus(null);
        return;
      }

      if (pendingVerseFocus.fallbackTried) return;

      const [chapterId, verseNumber] = pendingVerseFocus.verseKey.split(":").map(Number);
      if (!chapterId || !verseNumber) {
        setPendingVerseFocus(null);
        return;
      }

      setPendingVerseFocus((current) =>
        current ? { ...current, fallbackTried: true } : current
      );

      void (async () => {
        try {
          const result = await getVersesByRange(chapterId, verseNumber, verseNumber);
          const resolvedPage = result.verses[0]?.page_number;
          if (resolvedPage && resolvedPage !== requestedPageRef.current) {
            goToPage(resolvedPage);
          }
        } catch (error) {
          console.error("Failed to resolve verse focus page:", error);
        }
      })();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [applyTemporaryHighlight, goToPage, pendingVerseFocus, rangeData, verses, viewMode]);

  // Highlight verse on click
  const handleVerseClick = useCallback((verseKey: string) => {
    setHighlightedVerse((prev) => (verseKey === prev ? null : verseKey));
    setSelectedVerseForTafsir((prev) => (verseKey === prev ? null : verseKey));
  }, []);

  const handleVerseDoubleClick = useCallback((verseKey: string) => {
    openTafsirForVerse(verseKey, true);
  }, [openTafsirForVerse]);

  // Verse options menu handlers
  const handleVerseNumberClick = useCallback((verse: Verse, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedVerseForMenu(verse);
    setVerseMenuPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetDisplaySettings = useCallback(() => {
    setDisplaySettings({ ...DEFAULT_DISPLAY_SETTINGS });
    showToast(
      locale === "ar" ? "تمت إعادة إعدادات العرض الافتراضية" : "Display settings reset to defaults",
      "success"
    );
  }, [locale, showToast]);

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

    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };

    // Throttle time updates to max once per 500ms to avoid re-rendering
    // MushafViewer (1500+ line component) 4x per second
    let lastUpdateTime = 0;
    audio.ontimeupdate = () => {
      const now = Date.now();
      if (now - lastUpdateTime >= 500) {
        lastUpdateTime = now;
        setAudioCurrentTime(audio.currentTime);
      }
    };

    audio.play().catch(console.error);
    audio.onended = () => {
      const mode = repeatModeRef.current;
      const verseRepeatCount = verseRepeatCountRef.current;
      const rangeRepeatCount = rangeRepeatCountRef.current;
      const pauseBetweenVerses = pauseBetweenVersesRef.current;

      const currentViewMode = currentViewModeRef.current;
      const currentRangeData = currentRangeDataRef.current;
      const currentVerses = currentVersesRef.current;

      const allVerses = currentViewMode === "range" && currentRangeData ? currentRangeData.verses : currentVerses;
      const currentIndex = allVerses.findIndex((v: Verse) => v.verse_key === verseKey);

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
        } else if (currentViewMode === "pages" && requestedPageRef.current < TOTAL_PAGES) {
          // Smart Auto-Page Flip
          const nextPageToLoad = requestedPageRef.current + 1;
          goToPage(nextPageToLoad);
          // Wait briefly for page data to settle, then start playing the new page
          setTimeout(() => {
            if (activePageRequestIdRef.current) {
              const firstVerseCache = pageVersesCacheRef.current[nextPageToLoad]?.[0];
              if (firstVerseCache) {
                 playVerse(firstVerseCache.verse_key);
              }
            }
          }, 600);
        } else {
          setIsPlaying(false);
          setCurrentAudioVerse(null);
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

  const pauseAudio = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const resumeAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.ontimeupdate = null;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentAudioVerse(null);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setCurrentRangeRepeat(0);
    setCurrentVerseRepeat(0);
  };

  const handleNextVerse = () => {
    if (!currentAudioVerse) return;
    const currentViewMode = currentViewModeRef.current;
    const currentRangeData = currentRangeDataRef.current;
    const currentVerses = currentVersesRef.current;

    const allVerses = currentViewMode === "range" && currentRangeData ? currentRangeData.verses : currentVerses;
    const idx = allVerses.findIndex((v: Verse) => v.verse_key === currentAudioVerse);
    if (idx >= 0 && idx < allVerses.length - 1) {
      const nextVerseKey = allVerses[idx + 1].verse_key;
      setSelectedVerseForTafsir(nextVerseKey);
      setHighlightedVerse(nextVerseKey);
      playVerse(nextVerseKey);
    }
  };

  const handlePrevVerse = () => {
    if (!currentAudioVerse) return;
    const currentViewMode = currentViewModeRef.current;
    const currentRangeData = currentRangeDataRef.current;
    const currentVerses = currentVersesRef.current;

    const allVerses = currentViewMode === "range" && currentRangeData ? currentRangeData.verses : currentVerses;
    const idx = allVerses.findIndex((v: Verse) => v.verse_key === currentAudioVerse);
    if (idx > 0) {
      const nextVerseKey = allVerses[idx - 1].verse_key;
      setSelectedVerseForTafsir(nextVerseKey);
      setHighlightedVerse(nextVerseKey);
      playVerse(nextVerseKey);
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

  const moveHighlightedVerse = useCallback((delta: number): boolean => {
    const visibleVerses = viewMode === "range" && rangeData ? rangeData.verses : verses;
    if (visibleVerses.length === 0) return false;

    const activeVerseKey = activeDisplayVerseKey;
    if (!activeVerseKey) return false;

    const currentIndex = visibleVerses.findIndex((verse) => verse.verse_key === activeVerseKey);
    if (currentIndex === -1) return false;

    const nextIndex = Math.max(0, Math.min(visibleVerses.length - 1, currentIndex + delta));
    const nextVerseKey = visibleVerses[nextIndex]?.verse_key;
    if (!nextVerseKey) return true;

    setHighlightedVerse(nextVerseKey);
    setSelectedVerseForTafsir(nextVerseKey);
    window.requestAnimationFrame(() => {
      const selector = `[data-verse-key=\"${nextVerseKey}\"]`;
      const verseElement = document.querySelector(selector) as HTMLElement | null;
      verseElement?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    });

    return true;
  }, [activeDisplayVerseKey, rangeData, verses, viewMode]);

  // Auto-scroll using requestAnimationFrame (smooth, no CPU spinning)
  useEffect(() => {
    if (!autoScroll) return;
    let rafId: number;
    const step = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += scrollSpeed;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [autoScroll, scrollSpeed]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const currentScrollY = scrollContainerRef.current.scrollTop;
      if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollYRef.current) {
        setIsHeaderVisible(true);
      }
      lastScrollYRef.current = currentScrollY;
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    if (!isHeaderVisible && showScreenModeMenu) {
      setShowScreenModeMenu(false);
    }
  }, [isHeaderVisible, showScreenModeMenu]);

  useEffect(() => {
    if (!showScreenModeMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (screenModeMenuRef.current?.contains(target)) return;
      setShowScreenModeMenu(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowScreenModeMenu(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showScreenModeMenu]);

  // Keyboard navigation
  const handleGlobalKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement ||
      (e.target instanceof HTMLElement && e.target.isContentEditable)
    ) {
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const direction = e.key === "ArrowLeft" ? 1 : -1;
      const pageNavigation = e.key === "ArrowLeft" ? nextPage : prevPage;

      if (e.shiftKey) {
        e.preventDefault();
        pageNavigation();
        return;
      }

      const movedInVerses = moveHighlightedVerse(direction);
      e.preventDefault();
      if (movedInVerses) return;
      pageNavigation();
      return;
    }

    if (e.key === "Escape") {
      setShowIndex(false);
      closeTafsir();
      setVerseMenuPosition(null);
      setSelectedVerseForMenu(null);
      setShowDisplaySettings(false);
      setShowBookmarks(false);
      setShowScreenModeMenu(false);
    }
    if (e.key === "f" || e.key === "F") setShowIndex(true);
    if (e.key === " ") {
      e.preventDefault();
      if (showAudioPlayer && isPlaying) pauseAudio();
      else if (showAudioPlayer && !isPlaying && currentAudioVerse) resumeAudio();
      else if (showAudioPlayer && !isPlaying) playPage();
      else { setShowAudioPlayer(true); }
    }

    if (e.key === "v" || e.key === "V") {
      setShowVerseRangePanel((prev) => !prev);
    }

    if ((e.key === "r" || e.key === "R") && showVerseRangePanel) {
      // Focus on the verse range inputs
      const fromInput = document.querySelector('input[type="number"][placeholder="1"]') as HTMLInputElement;
      const toInput = document.querySelector('input[type="number"]:not([placeholder="1"])') as HTMLInputElement;
      if (fromInput) fromInput.focus();
      else if (toInput) toInput.focus();
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handleGlobalKeyDown(e);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentSurah = getCurrentSurah();
  const isRtl = locale === "ar";
  const pageVerseKeys = useMemo(() => resolveVerseKeysFromVerses(verses), [verses]);
  const rangeVerseKeys = useMemo(
    () => (rangeData ? resolveVerseKeysFromVerses(rangeData.verses) : []),
    [rangeData]
  );
  const hasRangeScope = rangeVerseKeys.length > 0;
  const hasPageScope = pageVerseKeys.length > 0;

  const activeTafsirScope = useMemo<TafsirScope | null>(() => {
    if (tafsirScopeMode === "ayah") {
      return {
        mode: "ayah",
        verseKey: activeAyahVerseKey,
      };
    }

    if (tafsirScopeMode === "range") {
      if (!rangeData || rangeVerseKeys.length === 0) return null;
      return {
        mode: "range",
        chapterId: rangeData.chapterId,
        fromVerse: rangeData.fromVerse,
        toVerse: rangeData.toVerse,
        verseKeys: rangeVerseKeys,
      };
    }

    if (pageVerseKeys.length === 0) return null;
    return {
      mode: "page",
      pageNumber: currentPage,
      verseKeys: pageVerseKeys,
    };
  }, [
    currentPage,
    pageVerseKeys,
    rangeData,
    rangeVerseKeys,
    activeAyahVerseKey,
    tafsirScopeMode,
  ]);

  const handleJumpToVerseFromTafsir = useCallback(
    (verseKey: string) => {
      setSelectedVerseForTafsir(verseKey);
      setPendingVerseFocus({ verseKey, fallbackTried: false });
    },
    []
  );

  useEffect(() => {
    if (tafsirScopeMode === "range" && !hasRangeScope) {
      setTafsirScopeMode(hasPageScope ? "page" : "ayah");
      return;
    }

    if (tafsirScopeMode === "page" && !hasPageScope) {
      setTafsirScopeMode("ayah");
    }
  }, [hasPageScope, hasRangeScope, setTafsirScopeMode, tafsirScopeMode]);

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

      {/* Header: grid-template-rows collapse — removes space from layout without layout thrashing */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: isHeaderVisible ? "1fr" : "0fr",
          transition: "grid-template-rows 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className="relative z-[var(--z-floating)]"
      >
        <div
          className={`mushaf-top-bar border-b border-primary/10 bg-card/60 px-6 shadow-sm backdrop-blur-md ${showScreenModeMenu ? "overflow-visible" : "overflow-hidden"} transition-opacity duration-250 ${isHeaderVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          style={{ minHeight: 0 }}
        >
          {/* Subtle top inner glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60" />

          <div
            className="flex items-center justify-between py-3"
          >
          <div className="p-1 mushaf-engraved-container flex items-center">
            <button
              type="button"
              title="فهرس السور"
              onClick={() => setShowIndex(true)}
              data-testid="open-index-panel"
              className="group relative flex items-center gap-3 px-4 py-2 rounded-xl bg-transparent hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer active:scale-[0.98]"
            >
              <span className="flex w-full min-w-0 items-center gap-3 whitespace-nowrap relative z-10">
                <span className="w-8 h-8 flex-shrink-0 rounded-lg bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center text-primary/80 group-hover:text-primary transition-all duration-300">
                  <Layers size={16} strokeWidth={2} />
                </span>
                <span className="flex min-w-0 items-center gap-2.5 leading-none whitespace-nowrap">
                  <span className="mushaf-text-overline text-primary/60 group-hover:text-primary/80 uppercase font-black tracking-[0.1em] px-1.5 py-0.5 rounded-md bg-transparent group-hover:bg-primary/5 transition-colors whitespace-nowrap">{t.mushaf.surah}</span>
                  <span className="text-xl font-bold font-['Amiri',serif] text-foreground/90 group-hover:text-foreground drop-shadow-sm whitespace-nowrap truncate pt-1 transition-colors">
                    {currentSurah?.name_arabic || ""}
                  </span>
                </span>
                <ChevronDown size={14} className="text-primary/40 group-hover:text-primary transition-all duration-300 ms-1 flex-shrink-0" />
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 p-1 mushaf-engraved-container">
            <MushafButton
              variant="icon"
              active={showVerseRangePanel}
              onClick={() => {
                if (viewMode === "range" && showVerseRangePanel) {
                  handleCloseVerseRange();
                } else {
                  setShowVerseRangePanel(!showVerseRangePanel);
                }
              }}
              icon={<BookOpen size={16} />}
              title={t.mushaf.verseRange}
              data-testid="open-verse-range-panel"
              className="hover:bg-primary/10 rounded-xl"
            />
            <MushafButton
              variant="icon"
              active={showBookmarks}
              onClick={() => setShowBookmarks(true)}
              icon={<Bookmark size={16} />}
              title={locale === "ar" ? "الإشارات المرجعية" : "Bookmarks"}
              className="hover:bg-primary/10 rounded-xl"
            />
            <MushafButton
              variant="icon"
              active={isTafsirOpen}
              onClick={() => {
                if (!isTafsirOpen && !activeAyahVerseKey) {
                  const fallbackVerseKey =
                    (viewMode === "range" ? rangeVerseKeys[0] : pageVerseKeys[0]) ?? null;
                  if (fallbackVerseKey) {
                    setSelectedVerseForTafsir(fallbackVerseKey);
                    openForAyah(fallbackVerseKey, { lockToVerse: false });
                    return;
                  }
                }
                toggleTafsirOpen();
              }}
              icon={<TafsirPanelIcon size={16} />}
              title={t.mushaf.openTafsirPanel}
              className="hover:bg-primary/10 rounded-xl"
              data-testid="open-tafsir-panel"
            />
            <MushafButton
              variant="icon"
              active={showAudioPlayer}
              onClick={() => setShowAudioPlayer((v) => !v)}
              icon={<Volume2 size={16} />}
              title={locale === "ar" ? t.mushaf.audioPlayer : t.mushaf.audioPlayer}
              data-testid="open-audio-panel"
              className="hover:bg-primary/10 rounded-xl"
            />
            <MushafButton
              variant="icon"
              active={autoScroll}
              onClick={() => setAutoScroll(!autoScroll)}
              icon={<Scroll size={16} />}
              title={locale === "ar" ? "التمرير التلقائي" : "Auto Scroll"}
              className="hover:bg-primary/10 rounded-xl"
            />
            <MushafButton
              variant="icon"
              active={showDisplaySettings}
              onClick={() => setShowDisplaySettings(true)}
              icon={<Settings size={16} />}
              title={t.mushaf.displaySettings}
              data-testid="open-display-settings-panel"
              className="hover:bg-primary/10 rounded-xl"
            />
            <div className="w-px h-5 bg-primary/10 mx-1" />
            <div ref={screenModeMenuRef} className="relative">
              <MushafButton
                variant="icon"
                active={screenMode !== "normal"}
                onClick={() => setShowScreenModeMenu(!showScreenModeMenu)}
                icon={screenMode === "focus" ? <Scan size={18} /> : screenMode === "fullscreen" ? <Maximize2 size={18} /> : <Monitor size={18} />}
                title={t.mushaf.screenMode}
              >
                <ChevronDown size={14} className={`transition-transform duration-300 ${showScreenModeMenu ? "rotate-180" : ""}`} />
              </MushafButton>
              {showScreenModeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute end-0 top-full mt-2 z-[var(--z-context-menu)] bg-card/95 backdrop-blur-md border border-border/40 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] py-2 min-w-[180px] overflow-hidden"
                >
                  {[
                    { value: "normal" as const, label: t.mushaf.screenModeNormal, icon: <Monitor size={16} /> },
                    { value: "focus" as const, label: t.mushaf.screenModeFocus, icon: <Scan size={16} /> },
                    { value: "fullscreen" as const, label: t.mushaf.screenModeFullscreen, icon: <Maximize2 size={16} /> },
                  ].map((mode) => (
                    <MushafButton
                      key={mode.value}
                      variant="ghost"
                      active={screenMode === mode.value}
                      onClick={() => { handleScreenModeChange(mode.value); setShowScreenModeMenu(false); }}
                      icon={mode.icon}
                      className="w-full justify-start rounded-md px-4 py-2"
                    >
                      <span className="flex-1 text-start">{mode.label}</span>
                      {screenMode === mode.value && <div className="ms-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                    </MushafButton>
                  ))}
                </motion.div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Mode Toolbar */}
      {studentId && (
        <div className="bg-primary/5 border-b border-primary/10 px-6 py-2 flex items-center justify-between text-sm z-[var(--z-floating)] relative">
          <div className="flex items-center gap-3">
            <span className="flex w-6 h-6 bg-primary/20 text-primary rounded-full items-center justify-center">
              <User size={14} />
            </span>
            <span className="font-semibold text-foreground/80">
              {locale === "ar" ? "مصحف الطالب:" : "Student Mushaf:"} <span className="text-primary">{studentName || "..."}</span>
            </span>
            {readOnly && (
               <span className="px-2 py-0.5 rounded bg-muted/50 text-muted-foreground text-xs font-semibold">
                 {locale === "ar" ? "للقراءة فقط" : "Read Only"}
               </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!readOnly && (
              <>
                <div className="flex bg-background border border-border/50 rounded overflow-hidden shadow-sm mx-2">
                  <button
                    onClick={() => setIsTemporaryAnnotation(false)}
                    className={`px-3 py-1.5 text-xs font-medium flex-1 transition-colors ${!isTemporaryAnnotation ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                  >
                    {locale === "ar" ? "تعليق دائم" : "Perm. Note"}
                  </button>
                  <button
                    onClick={() => setIsTemporaryAnnotation(true)}
                    className={`px-3 py-1.5 text-xs font-medium flex-1 transition-colors ${isTemporaryAnnotation ? 'bg-yellow-400/20 text-yellow-700' : 'hover:bg-muted/50 text-muted-foreground'}`}
                  >
                    {locale === "ar" ? "تحديد مؤقت" : "Temp Highlight"}
                  </button>
                </div>
                
                <button
                  onClick={() => clearTemporaryAnnotations()}
                  title={locale === "ar" ? "مسح التحديد المؤقت" : "Clear Temp Highlights"}
                  className="p-1.5 text-xs font-medium bg-background border border-border/50 hover:bg-muted/50 text-muted-foreground hover:text-red-500 rounded shadow-sm transition-colors me-1"
                >
                  <Eraser size={14} />
                </button>
                
                <button
                  onClick={exportAsImage}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background border border-border/50 hover:bg-muted/50 rounded shadow-sm transition-colors"
                >
                  <ImageIcon size={14} className="text-primary" />
                  <span>{locale === "ar" ? "صورة" : "Image"}</span>
                </button>
                <button
                  onClick={exportAsPDF}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background border border-border/50 hover:bg-muted/50 rounded shadow-sm transition-colors"
                >
                  <FileText size={14} className="text-primary" />
                  <span>{locale === "ar" ? "PDF" : "PDF"}</span>
                </button>
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded shadow-sm transition-colors"
                >
                  <LinkIcon size={14} />
                  <span>{locale === "ar" ? "رابط المشاركة" : "Share Link"}</span>
                </button>
              </>
            )}
            {readOnly && (
               <button
                  onClick={exportAsImage}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background border border-border/50 hover:bg-muted/50 rounded shadow-sm transition-colors"
                >
                  <ImageIcon size={14} className="text-primary" />
                  <span>{locale === "ar" ? "صورة" : "Image"}</span>
                </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mushaf-reading-layout flex-1 bg-background/50" ref={mushafRef}>
        <div className="flex-1 overflow-auto custom-scrollbar" ref={scrollContainerRef}>
          <div className={`${getPageWidthClass(pageWidth)} mx-auto px-4 sm:px-8 py-10`}>
            {viewMode === "range" ? (
              loading && !rangeData ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                </div>
              ) : rangeData ? (
                // Range Mode View
                <MushafPageFrame
                  locale={locale}
                  isRangeMode={true}
                  chapterName={rangeData.chapterInfo?.name_arabic || `سورة ${rangeData.chapterId}`}
                  chapterId={rangeData.chapterId}
                  fromVerse={rangeData.fromVerse}
                  toVerse={rangeData.toVerse}
                  fontSizeClass={getFontSizeClass(fontSize)}
                >
                  {/* Range Verses */}
                  <div className={`quran-text text-center leading-[2.8] ${getFontSizeClass(fontSize)}`} dir="rtl">
                    {rangeData.verses.map((verse) => (
                      <span
                        key={verse.verse_key}
                        data-verse-key={verse.verse_key}
                        className={`cursor-pointer transition-all duration-500 ease-out inline relative verse-ayah ${activeDisplayVerseKey === verse.verse_key
                          ? "verse-highlight-strong z-10"
                          : ""
                          }`}
                        onClick={() => handleVerseClick(verse.verse_key)}
                        onDoubleClick={() => handleVerseDoubleClick(verse.verse_key)}
                      >
                        {studentId ? renderVerseWithAnnotations(verse, activeDisplayVerseKey) : (
                          <span className={activeDisplayVerseKey === verse.verse_key ? "drop-shadow-sm" : ""}>{verse.text_uthmani}</span>
                        )}{" "}
                        <span
                          className="inline-flex items-center justify-center font-sans mx-1.5 transition-all duration-300 hover:scale-110 hover:text-secondary text-primary/60 hover:drop-shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.35)] cursor-pointer select-none"
                          onClick={(e) => handleVerseNumberClick(verse, e)}
                        >
                          ۝{verse.verse_number.toLocaleString("ar-EG")}
                        </span>{" "}
                      </span>
                    ))}
                  </div>
                </MushafPageFrame>
              ) : null
            ) : (
              /* Normal Pages Mode */
              <div>
                <MushafPageView
                  pageNumber={currentPage}
                  fontSizeClass={getFontSizeClass(fontSize)}
                  chapters={chapters}
                  locale={locale}
                  juzLabel={t.mushaf.juz}
                  endOfMushafLabel={locale === "ar" ? "نهاية المصحف" : "End of Mushaf"}
                  verses={verses}
                  activeVerseKey={activeDisplayVerseKey}
                  onVerseClick={handleVerseClick}
                  onVerseDoubleClick={handleVerseDoubleClick}
                  onVerseNumberClick={handleVerseNumberClick}
                  renderVerseText={studentId ? renderVerseWithAnnotations : undefined}
                />
              </div>
            )}
          </div>
        </div>

        {isDockedTafsirLayout ? (
          <TafsirDockedSidebar
            isOpen={isTafsirOpen}
            width={Math.min(tafsirSidebarWidth, viewportWidth / 2)}
            minWidth={360}
            maxWidth={viewportWidth / 2}
            onWidthChange={setTafsirSidebarWidth}
            scopeMode={tafsirScopeMode}
            onScopeModeChange={setTafsirScopeMode}
            followMode={tafsirFollowMode}
            onToggleFollowMode={toggleTafsirFollowMode}
            scope={activeTafsirScope}
            selectedTafsirId={selectedTafsirId}
            onSelectTafsirId={setSelectedTafsirId}
            onClose={closeTafsir}
            onPlayVerse={playVerse}
            onJumpToVerse={handleJumpToVerseFromTafsir}
            hasRangeScope={hasRangeScope}
            hasPageScope={hasPageScope}
          />
        ) : null}
      </div>

      {/* Bottom Navigation - Hide in range mode */}
      {viewMode === "pages" && (
        <div className="mushaf-bottom-nav flex items-center justify-center gap-2.5 sm:gap-4 px-3 sm:px-6 py-3.5 bg-card/95 backdrop-blur-md border-t border-border/40 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
          <MushafPageFlipButton
            direction="prev"
            label={t.mushaf.prevPage}
            onClick={prevPage}
            disabled={currentPage - pageStep < 1}
            isRtl={isRtl}
          />

          <div
            className="shrink-0 min-w-[88px] sm:min-w-[112px] mushaf-engraved-container px-2.5 sm:px-4 py-2 text-center flex flex-col justify-center items-center"
            role="status"
            aria-live="polite"
            aria-label={locale === "ar" ? `الصفحة ${currentPage} من ${TOTAL_PAGES}` : `Page ${currentPage} of ${TOTAL_PAGES}`}
          >
            <span className="mushaf-text-overline block font-semibold text-muted-foreground leading-none">
              {t.mushaf.page}
            </span>
            <div className="mt-0.5 sm:mt-1 flex items-baseline justify-center gap-1 leading-none">
              <span className="text-base sm:text-lg font-black text-primary tabular-nums">
                {currentPage}
              </span>
              <span className="mushaf-text-meta font-medium text-muted-foreground/70">/</span>
              <span className="mushaf-text-compact font-semibold text-muted-foreground tabular-nums">
                {TOTAL_PAGES}
              </span>
            </div>
          </div>

          <MushafPageFlipButton
            direction="next"
            label={t.mushaf.nextPage}
            onClick={nextPage}
            disabled={currentPage + pageStep > TOTAL_PAGES}
            isRtl={isRtl}
          />
        </div>
      )}

      {/* Unified Index & Search Panel */}
      <AdvancedSearch
        isOpen={showIndex}
        onClose={() => setShowIndex(false)}
        chapters={chapters}
        onNavigate={handleNavigateFromIndex}
      />

      <BookmarksPanel
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        onNavigate={handleNavigateToBookmark}
      />

      {/* Floating Verse Range Panel */}
      <FloatingVerseRangePanel
        isOpen={showVerseRangePanel}
        onClose={handleCloseVerseRange}
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

      {isMobileTafsirSheet ? (
        <TafsirBottomSheet
          isOpen={isTafsirOpen}
          onClose={closeTafsir}
          scopeMode={tafsirScopeMode}
          onScopeModeChange={setTafsirScopeMode}
          followMode={tafsirFollowMode}
          onToggleFollowMode={toggleTafsirFollowMode}
          scope={activeTafsirScope}
          selectedTafsirId={selectedTafsirId}
          onSelectTafsirId={setSelectedTafsirId}
          onPlayVerse={playVerse}
          onJumpToVerse={handleJumpToVerseFromTafsir}
          hasRangeScope={hasRangeScope}
          hasPageScope={hasPageScope}
        />
      ) : null}

      <VerseOptionsMenu
        position={!selectionRange ? verseMenuPosition : null}
        verseKey={selectedVerseForMenu?.verse_key ?? ""}
        verseText={selectedVerseForMenu?.text_uthmani ?? ""}
        onTafsir={() => {
          if (selectedVerseForMenu) {
            openTafsirForVerse(selectedVerseForMenu.verse_key, true);
          }
        }}
        onPlay={() => {
          if (selectedVerseForMenu) {
            playVerse(selectedVerseForMenu.verse_key);
          }
        }}
        onCopy={async () => {
          if (!selectedVerseForMenu) return;
          const copied = await copyVerseToClipboard(selectedVerseForMenu.verse_key, selectedVerseForMenu.text_uthmani);
          showToast(
            copied
              ? (locale === "ar" ? "تم نسخ الآية" : "Verse copied")
              : (locale === "ar" ? "فشل نسخ الآية" : "Failed to copy verse"),
            copied ? "success" : "error"
          );
        }}
        onShare={async () => {
          if (!selectedVerseForMenu) return;
          const shared = await shareVerse(selectedVerseForMenu.verse_key, selectedVerseForMenu.text_uthmani);
          if (!shared) {
            showToast(locale === "ar" ? "تعذر مشاركة الآية" : "Unable to share verse", "error");
          }
        }}
        onBookmark={() => {
          if (!selectedVerseForMenu) return;
          const verseKey = selectedVerseForMenu.verse_key;
          const bookmarked = isBookmarked(verseKey);
          if (bookmarked) {
            removeBookmarkByVerseKey(verseKey);
          } else {
            addBookmark(verseKey, selectedVerseForMenu.chapter_id, currentPage);
          }
          showToast(
            bookmarked
              ? (locale === "ar" ? "تم حذف العلامة" : "Bookmark removed")
              : (locale === "ar" ? "تمت إضافة علامة" : "Bookmark added"),
            "success"
          );
        }}
        isBookmarked={selectedVerseForMenu ? isBookmarked(selectedVerseForMenu.verse_key) : false}
        onClose={() => {
          setVerseMenuPosition(null);
          setSelectedVerseForMenu(null);
        }}
      />

      {/* Selection Annotation Popup */}
      <AnimatePresence>
        {selectionRange && verseMenuPosition && !readOnly && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              left: verseMenuPosition.x,
              top: verseMenuPosition.y,
              transform: "translateX(-50%)",
            }}
            className="z-[var(--z-context-menu)] bg-card rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-border/50 p-3 min-w-[280px]"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{locale === "ar" ? "نص محدد" : "Selected Text"}</span>
                <MushafCloseButton onClick={() => setSelectionRange(null)} />
              </div>
              <p className="text-lg font-['Amiri',serif] leading-relaxed text-center px-4" dir="rtl">{selectionRange.text}</p>
              
              <div className="flex items-center gap-2">
                 <button
                   onClick={() => setIsTemporaryAnnotation(false)}
                   className={`flex-1 py-1.5 px-2 rounded font-medium text-xs transition-colors ${!isTemporaryAnnotation ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'}`}
                 >
                   {locale === "ar" ? "خطأ دائم" : "Permanent"}
                 </button>
                 <button
                   onClick={() => setIsTemporaryAnnotation(true)}
                   className={`flex-1 py-1.5 px-2 rounded font-medium text-xs transition-colors ${isTemporaryAnnotation ? 'bg-yellow-500 text-white' : 'bg-muted text-muted-foreground'}`}
                 >
                   {locale === "ar" ? "ملاحظة مؤقتة" : "Temporary"}
                 </button>
              </div>

              <textarea
                value={newAnnotationComment}
                onChange={(e) => setNewAnnotationComment(e.target.value)}
                placeholder={locale === "ar" ? "أضف تعليقاً (اختياري)..." : "Add a comment (optional)..."}
                className="w-full h-20 text-sm p-2 bg-background border border-border/50 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                dir={locale === "ar" ? "rtl" : "ltr"}
              />

              <button
                onClick={async () => {
                  const success = await addAnnotation({
                    verseKey: selectionRange.verseKey,
                    text: selectionRange.text,
                    startOffset: selectionRange.startOffset,
                    endOffset: selectionRange.endOffset,
                    comment: newAnnotationComment,
                    isTemporary: isTemporaryAnnotation,
                  });
                  if (success) {
                    showToast(locale === "ar" ? "تم حفظ التعليق" : "Annotation saved", "success");
                    setSelectionRange(null);
                    setNewAnnotationComment("");
                  } else {
                    showToast(locale === "ar" ? "حدث خطأ أثناء الحفظ" : "Failed to save annotation", "error");
                  }
                }}
                className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-sm transition-colors hover:bg-primary/90 shadow-sm"
              >
                {locale === "ar" ? "حفظ التعليق" : "Save Annotation"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Display Settings */}
      <DisplaySettings
        isOpen={showDisplaySettings}
        onClose={() => setShowDisplaySettings(false)}
        onResetToDefaults={handleResetDisplaySettings}
        fontSize={fontSize}
        setFontSize={setFontSize}
        pageWidth={pageWidth}
        setPageWidth={setPageWidth}
        readingMode={readingMode}
        setReadingMode={setReadingMode}
      />

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
