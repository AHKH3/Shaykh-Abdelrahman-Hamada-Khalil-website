"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Brain, BarChart3, Navigation, History, Calendar, PlayCircle, Plus, Minus, Search, X, HelpCircle, ChevronLeft, ChevronRight, Keyboard, Lightbulb } from "lucide-react";
import type { Chapter, Verse } from "@/lib/quran/api";
import { validateVerseRange } from "@/lib/quran/api";
import { useI18n } from "@/lib/i18n/context";
import { motion, AnimatePresence } from "framer-motion";
import { QuickPresets } from "./verse-range/QuickPresets";
import { MemorizationMode } from "./verse-range/MemorizationMode";
import { RangeProgress } from "./verse-range/RangeProgress";
import { RangeNavigation } from "./verse-range/RangeNavigation";
import { SmartSuggestions } from "./verse-range/SmartSuggestions";
import { RangeHistory } from "./verse-range/RangeHistory";
import { BookmarkRanges } from "./verse-range/BookmarkRanges";
import { saveRangeToHistory } from "@/lib/quran/range-utils";

interface VerseRangeFormProps {
  chapters: Chapter[];
  onSelectRange: (chapterId: number, from: number, to: number) => void;
  onClose?: () => void;
  initialChapterId?: number;
  initialFromVerse?: number;
  initialToVerse?: number;
  // New props for advanced features
  currentVerses?: Verse[];
  currentPage?: number;
  currentAudioVerse?: string | null;
  isPlaying?: boolean;
  onPlayVerse?: (verseKey: string) => void;
  onPauseAudio?: () => void;
  onResumeAudio?: () => void;
  // Phase 2 props
  autoCollapseDelay?: number;
  onAutoCollapseDelayChange?: (delay: number) => void;
  isExpanded?: boolean;
  // Phase 3 props
  currentVerse?: Verse | null;
  onTogglePanel?: () => void;
}

type TabType = "range" | "memorization" | "progress" | "navigation" | "suggestions" | "history" | "bookmarks";

// LocalStorage keys
const RECENT_SURAHS_KEY = "quran-recent-surahs";
const LAST_SESSION_KEY = "quran-last-session";

export function VerseRangeForm({
  chapters,
  onSelectRange,
  onClose,
  initialChapterId,
  initialFromVerse,
  initialToVerse,
  currentVerses = [],
  currentPage = 1,
  currentAudioVerse = null,
  isPlaying = false,
  onPlayVerse,
  onPauseAudio,
  onResumeAudio,
  autoCollapseDelay = 0,
  onAutoCollapseDelayChange,
  isExpanded = true,
  currentVerse = null,
  onTogglePanel,
}: VerseRangeFormProps) {
  const { t, locale } = useI18n();

  // Initialize with provided values or defaults
  const getInitialChapter = () => {
    if (initialChapterId) {
      return chapters.find(c => c.id === initialChapterId) || null;
    }
    return null;
  };

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(getInitialChapter);
  const [fromVerse, setFromVerse] = useState(initialFromVerse?.toString() || "");
  const [toVerse, setToVerse] = useState(initialToVerse?.toString() || "");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("range");

  // Phase 3: Searchable dropdown state
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentSurahs, setRecentSurahs] = useState<number[]>([]);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Ref for dropdown click outside detection
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent surahs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SURAHS_KEY);
    if (stored) {
      try {
        setRecentSurahs(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent surahs", e);
      }
    }
  }, []);

  // Save surah to recent list when selected
  const addToRecentSurahs = (chapterId: number) => {
    setRecentSurahs(prev => {
      const filtered = prev.filter(id => id !== chapterId);
      const updated = [chapterId, ...filtered].slice(0, 5); // Keep last 5
      localStorage.setItem(RECENT_SURAHS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter chapters based on search query
  const filteredChapters = chapters.filter(ch => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      ch.name_arabic.includes(query) ||
      ch.name_simple?.toLowerCase().includes(query) ||
      ch.translated_name?.name?.toLowerCase().includes(query) ||
      ch.id.toString().includes(query)
    );
  });

  // Get recent chapters
  const recentChapters = recentSurahs
    .map(id => chapters.find(c => c.id === id))
    .filter((c): c is Chapter => c !== undefined);

  // Update form when initial values change (e.g., when panel is reopened with new range)
  useEffect(() => {
    if (initialChapterId) {
      const chapter = chapters.find(c => c.id === initialChapterId);
      if (chapter) {
        setSelectedChapter(chapter);
      }
    }
    if (initialFromVerse !== undefined) {
      setFromVerse(initialFromVerse.toString());
    }
    if (initialToVerse !== undefined) {
      setToVerse(initialToVerse.toString());
    }
  }, [initialChapterId, initialFromVerse, initialToVerse, chapters]);

  const handleSubmit = () => {
    if (!selectedChapter) {
      setError(locale === "ar" ? "اختر سورة" : "Select a surah");
      return;
    }

    const from = parseInt(fromVerse);
    const to = parseInt(toVerse);

    if (!from || !to) {
      setError(t.mushaf.enterVerseNumbers);
      return;
    }

    const validation = validateVerseRange(selectedChapter.id, from, to, chapters);
    if (!validation.valid) {
      setError(locale === "ar" ? validation.error! : validation.errorEn!);
      return;
    }

    setError("");
    // Save to recent surahs
    addToRecentSurahs(selectedChapter.id);
    // Save last session
    localStorage.setItem(LAST_SESSION_KEY, JSON.stringify({
      chapterId: selectedChapter.id,
      from,
      to,
      timestamp: Date.now(),
    }));
    // Save to range history (Phase 4)
    saveRangeToHistory(selectedChapter.id, selectedChapter.name_arabic, from, to);
    onSelectRange(selectedChapter.id, from, to);
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

  const handlePresetSelect = (chapterId: number, from: number, to: number) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (chapter) {
      setSelectedChapter(chapter);
      setFromVerse(from.toString());
      setToVerse(to.toString());
      setError("");
    }
  };

  // Phase 3: One-Click Quick Actions
  const handleReviewLastSession = () => {
    const lastSession = localStorage.getItem(LAST_SESSION_KEY);
    if (lastSession) {
      try {
        const session = JSON.parse(lastSession);
        const chapter = chapters.find(c => c.id === session.chapterId);
        if (chapter) {
          setSelectedChapter(chapter);
          setFromVerse(session.from.toString());
          setToVerse(session.to.toString());
          setError("");
          // Auto-submit
          onSelectRange(session.chapterId, session.from, session.to);
        }
      } catch (e) {
        console.error("Failed to load last session", e);
      }
    }
  };

  const handleContinueFromHere = () => {
    if (currentVerse) {
      const chapter = chapters.find(c => c.id === currentVerse.chapter_id);
      if (chapter) {
        setSelectedChapter(chapter);
        const verseNum = currentVerse.verse_number;
        const toNum = Math.min(verseNum + 9, chapter.verses_count);
        setFromVerse(verseNum.toString());
        setToVerse(toNum.toString());
        setError("");
        // Auto-submit
        onSelectRange(currentVerse.chapter_id, verseNum, toNum);
      }
    }
  };

  const handleQuick10Verses = () => {
    if (currentVerse) {
      const chapter = chapters.find(c => c.id === currentVerse.chapter_id);
      if (chapter) {
        setSelectedChapter(chapter);
        const verseNum = currentVerse.verse_number;
        const toNum = Math.min(verseNum + 9, chapter.verses_count);
        setFromVerse(verseNum.toString());
        setToVerse(toNum.toString());
        setError("");
        onSelectRange(currentVerse.chapter_id, verseNum, toNum);
      }
    }
  };

  const handleTodaysVerses = () => {
    // For now, just load last session as today's verses
    handleReviewLastSession();
  };

  // Phase 3: Verse Stepper Buttons
  const handleVerseAdjust = (field: "from" | "to", delta: number) => {
    if (!selectedChapter) return;
    const currentValue = parseInt(field === "from" ? fromVerse : toVerse) || 0;
    const newValue = Math.max(1, Math.min(selectedChapter.verses_count, currentValue + delta));
    if (field === "from") {
      setFromVerse(newValue.toString());
    } else {
      setToVerse(newValue.toString());
    }
    setError("");
  };

  const handleQuickAdjust = (delta: number) => {
    const from = parseInt(fromVerse) || 1;
    const to = parseInt(toVerse) || 10;
    setFromVerse(Math.max(1, from + delta).toString());
    setToVerse(Math.max(1, to + delta).toString());
    setError("");
  };

  // Tabs configuration
  const tabs: { id: TabType; labelAr: string; labelEn: string; icon: React.ReactNode; shortcut?: string }[] = [
    { id: "range", labelAr: "المدى", labelEn: "Range", icon: <ChevronDown size={14} /> },
    { id: "suggestions", labelAr: "الاقتراحات", labelEn: "Suggestions", icon: <Lightbulb size={14} /> },
    { id: "history", labelAr: "السجل", labelEn: "History", icon: <History size={14} /> },
    { id: "bookmarks", labelAr: "الإشارات", labelEn: "Bookmarks", icon: <Calendar size={14} /> },
    { id: "memorization", labelAr: "الحفظ", labelEn: "Memorize", icon: <Brain size={14} />, shortcut: "M" },
    { id: "progress", labelAr: "التقدم", labelEn: "Progress", icon: <BarChart3 size={14} /> },
    { id: "navigation", labelAr: "التنقل", labelEn: "Navigate", icon: <Navigation size={14} />, shortcut: "N/P" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab.icon}
            <span>{locale === "ar" ? tab.labelAr : tab.labelEn}</span>
            {tab.shortcut && (
              <span className="text-[10px] text-muted-foreground/70 opacity-50">({tab.shortcut})</span>
            )}
          </motion.button>
        ))}
        {/* Keyboard shortcuts help button */}
        <motion.button
          onClick={() => setShowShortcutsHelp(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-1 px-2 py-2.5 text-xs border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
          title={t.mushaf.keyboardShortcutsHelp}
        >
          <Keyboard size={14} />
        </motion.button>
      </div>

      {/* Auto-collapse settings */}
      <AnimatePresence>
        {isExpanded && onAutoCollapseDelayChange && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 border-b border-border/60 bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {locale === "ar" ? "الإغلاق التلقائي" : "Auto-collapse"}
              </span>
              <select
                value={autoCollapseDelay}
                onChange={(e) => onAutoCollapseDelayChange(parseInt(e.target.value))}
                className="text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value={0}>{locale === "ar" ? "معطل" : "Disabled"}</option>
                <option value={5}>{locale === "ar" ? "٥ ثوانٍ" : "5 seconds"}</option>
                <option value={10}>{locale === "ar" ? "١٠ ثوانٍ" : "10 seconds"}</option>
                <option value={30}>{locale === "ar" ? "٣٠ ثانية" : "30 seconds"}</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === "range" && (
            <motion.div
              key="range"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Phase 3: One-Click Quick Actions */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">{locale === "ar" ? "إجراءات سريعة" : "Quick Actions"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    onClick={handleReviewLastSession}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-3 py-2 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg border border-primary/30 transition-colors"
                  >
                    <History size={14} />
                    <span>{t.mushaf.reviewLastSession}</span>
                  </motion.button>
                  <motion.button
                    onClick={handleTodaysVerses}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-3 py-2 text-xs bg-accent hover:bg-accent/80 rounded-lg border border-border transition-colors"
                  >
                    <Calendar size={14} />
                    <span>{t.mushaf.todaysVerses}</span>
                  </motion.button>
                  <motion.button
                    onClick={handleContinueFromHere}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!currentVerse}
                    className="flex items-center gap-2 px-3 py-2 text-xs bg-accent hover:bg-accent/80 rounded-lg border border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlayCircle size={14} />
                    <span>{t.mushaf.continueFromHere}</span>
                  </motion.button>
                  <motion.button
                    onClick={handleQuick10Verses}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!currentVerse}
                    className="flex items-center gap-2 px-3 py-2 text-xs bg-accent hover:bg-accent/80 rounded-lg border border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Navigation size={14} />
                    <span>{t.mushaf.quick10Verses}</span>
                  </motion.button>
                </div>
              </div>

              {/* Quick Presets */}
              <QuickPresets
                chapters={chapters}
                currentPage={currentPage}
                currentVerses={currentVerses}
                onSelectPreset={handlePresetSelect}
              />

              {/* Phase 3: Searchable Surah Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">{t.mushaf.selectSurah}</label>
                <div className="relative" ref={dropdownRef}>
                  {/* Searchable input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder={t.mushaf.searchSurahPlaceholder}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none pr-10"
                      dir={locale === "ar" ? "rtl" : "ltr"}
                    />
                    <Search
                      size={16}
                      className={`absolute top-1/2 -translate-y-1/2 ${locale === "ar" ? "left-3" : "right-3"} pointer-events-none text-muted-foreground`}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setIsDropdownOpen(false);
                        }}
                        className={`absolute top-1/2 -translate-y-1/2 ${locale === "ar" ? "right-8" : "left-8"} pointer-events-none text-muted-foreground hover:text-foreground`}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto"
                      >
                        {/* Recent surahs */}
                        {recentChapters.length > 0 && !searchQuery && (
                          <div className="border-b border-border">
                            <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                              {t.mushaf.recentSurahs}
                            </div>
                            {recentChapters.map((ch) => (
                              <button
                                key={ch.id}
                                onClick={() => {
                                  setSelectedChapter(ch);
                                  setFromVerse("");
                                  setToVerse("");
                                  setError("");
                                  setSearchQuery("");
                                  setIsDropdownOpen(false);
                                }}
                                className="w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2"
                                dir={locale === "ar" ? "rtl" : "ltr"}
                              >
                                <span className="text-muted-foreground">{ch.id}.</span>
                                <span className="font-medium">{ch.name_arabic}</span>
                                <span className="text-muted-foreground text-xs">- {ch.translated_name.name}</span>
                                <span className="text-xs text-muted-foreground/70">({ch.verses_count})</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* All surahs */}
                        <div>
                          {!searchQuery && recentChapters.length > 0 && (
                            <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                              {t.mushaf.allSurahsList}
                            </div>
                          )}
                          {filteredChapters.map((ch) => (
                            <button
                              key={ch.id}
                              onClick={() => {
                                setSelectedChapter(ch);
                                setFromVerse("");
                                setToVerse("");
                                setError("");
                                setSearchQuery("");
                                setIsDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2"
                              dir={locale === "ar" ? "rtl" : "ltr"}
                            >
                              <span className="text-muted-foreground">{ch.id}.</span>
                              <span className="font-medium">{ch.name_arabic}</span>
                              <span className="text-muted-foreground text-xs">- {ch.translated_name.name}</span>
                              <span className="text-xs text-muted-foreground/70">({ch.verses_count})</span>
                            </button>
                          ))}
                          {filteredChapters.length === 0 && (
                            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                              {locale === "ar" ? "لا توجد نتائج" : "No results"}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Verse Range Input with Stepper Buttons */}
              {selectedChapter && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t.mushaf.from} {locale === "ar" ? "الآية" : "verse"}
                      </label>
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleVerseAdjust("from", -1)}
                          className="p-2 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors"
                          title="-1"
                        >
                          <Minus size={14} />
                        </motion.button>
                        <input
                          type="number"
                          min={1}
                          max={selectedChapter.verses_count}
                          value={fromVerse}
                          onChange={(e) => { setFromVerse(e.target.value); setError(""); }}
                          className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="1"
                          dir="ltr"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleVerseAdjust("from", 1)}
                          className="p-2 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors"
                          title="+1"
                        >
                          <Plus size={14} />
                        </motion.button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t.mushaf.to} {locale === "ar" ? "الآية" : "verse"}
                      </label>
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleVerseAdjust("to", -1)}
                          className="p-2 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors"
                          title="-1"
                        >
                          <Minus size={14} />
                        </motion.button>
                        <input
                          type="number"
                          min={1}
                          max={selectedChapter.verses_count}
                          value={toVerse}
                          onChange={(e) => { setToVerse(e.target.value); setError(""); }}
                          className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder={selectedChapter.verses_count.toString()}
                          dir="ltr"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleVerseAdjust("to", 1)}
                          className="p-2 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors"
                          title="+1"
                        >
                          <Plus size={14} />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Adjust Buttons */}
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.mushaf.quickAdjust}</label>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAdjust(-5)}
                        className="flex-1 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors"
                      >
                        -5
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAdjust(-1)}
                        className="flex-1 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors"
                      >
                        -1
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAdjust(1)}
                        className="flex-1 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors"
                      >
                        +1
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAdjust(5)}
                        className="flex-1 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors"
                      >
                        +5
                      </motion.button>
                    </div>
                  </div>

                  {/* Quick Selections */}
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.mushaf.quickRanges}</label>
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
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {onClose && (
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors font-medium text-sm"
                  >
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedChapter || !fromVerse || !toVerse}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  {t.mushaf.showRange}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "memorization" && (
            <motion.div
              key="memorization"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <MemorizationMode
                verses={currentVerses}
                currentVerseKey={currentAudioVerse}
              />
            </motion.div>
          )}

          {activeTab === "progress" && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {currentVerses.length > 0 ? (
                <RangeProgress
                  verses={currentVerses}
                  currentVerseKey={currentAudioVerse}
                  onVerseClick={onPlayVerse || (() => { })}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {locale === "ar" ? "اختر مدى لعرض التقدم" : "Select a range to see progress"}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "navigation" && (
            <motion.div
              key="navigation"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {selectedChapter && fromVerse && toVerse ? (
                <RangeNavigation
                  chapterId={selectedChapter.id}
                  fromVerse={parseInt(fromVerse)}
                  toVerse={parseInt(toVerse)}
                  chapters={chapters}
                  onNavigate={(chapterId, from, to) => {
                    handlePresetSelect(chapterId, from, to);
                    onSelectRange(chapterId, from, to);
                  }}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {locale === "ar" ? "اختر مدى للتنقل" : "Select a range to navigate"}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "suggestions" && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <SmartSuggestions
                chapters={chapters}
                currentPage={currentPage}
                currentChapterId={currentVerse?.chapter_id}
                currentVerseNumber={currentVerse?.verse_number}
                verses={currentVerses}
                onSelectSuggestion={(chapterId, from, to) => {
                  const chapter = chapters.find(c => c.id === chapterId);
                  if (chapter) {
                    setSelectedChapter(chapter);
                    setFromVerse(from.toString());
                    setToVerse(to.toString());
                    setError("");
                    onSelectRange(chapterId, from, to);
                  }
                }}
              />
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <RangeHistory
                onSelectRange={(chapterId, from, to) => {
                  const chapter = chapters.find(c => c.id === chapterId);
                  if (chapter) {
                    setSelectedChapter(chapter);
                    setFromVerse(from.toString());
                    setToVerse(to.toString());
                    setError("");
                    onSelectRange(chapterId, from, to);
                  }
                }}
                currentChapterId={selectedChapter?.id}
                currentFromVerse={fromVerse ? parseInt(fromVerse) : undefined}
                currentToVerse={toVerse ? parseInt(toVerse) : undefined}
              />
            </motion.div>
          )}

          {activeTab === "bookmarks" && (
            <motion.div
              key="bookmarks"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <BookmarkRanges
                chapters={chapters}
                onSelectRange={(chapterId, from, to) => {
                  const chapter = chapters.find(c => c.id === chapterId);
                  if (chapter) {
                    setSelectedChapter(chapter);
                    setFromVerse(from.toString());
                    setToVerse(to.toString());
                    setError("");
                    onSelectRange(chapterId, from, to);
                  }
                }}
                currentChapterId={selectedChapter?.id}
                currentFromVerse={fromVerse ? parseInt(fromVerse) : undefined}
                currentToVerse={toVerse ? parseInt(toVerse) : undefined}
                onPlayVerse={onPlayVerse}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <AnimatePresence>
        {showShortcutsHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowShortcutsHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border border-border max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Keyboard size={16} className="text-primary" />
                  {t.mushaf.keyboardShortcutsHelp}
                </h3>
                <button
                  onClick={() => setShowShortcutsHelp(false)}
                  className="p-1 rounded-lg hover:bg-accent transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-96 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t.mushaf.togglePanel}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">V / Alt+V</kbd>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{t.mushaf.focusRange}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">R / Alt+R</kbd>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{t.mushaf.nextRangeShortcut}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">N / Alt+N</kbd>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{t.mushaf.prevRangeShortcut}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">P / Alt+P</kbd>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{t.mushaf.toggleMemorization}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">M / Alt+M</kbd>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{t.mushaf.showHideVerses}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">S / Alt+S</kbd>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{t.mushaf.closePanel}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Esc</kbd>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Legacy default export kept for backward compat (not used after migration)
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
  useEffect(() => {
    if (!isOpen) return;
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border border-border max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <VerseRangeForm chapters={chapters} onSelectRange={onSelectRange} onClose={onClose} />
      </div>
    </div>
  );
}
