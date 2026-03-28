"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, LockOpen, ChevronDown, Check, Search, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { TAFSIR_RESOURCES } from "@/lib/quran/api";
import type {
  TafsirFollowMode,
  TafsirScope,
  TafsirScopeMode,
} from "@/lib/hooks/useTafsirWorkspace";
import MushafButton from "../ui/MushafButton";
import MushafCloseButton from "../ui/MushafCloseButton";
import TafsirInspectorContent from "./TafsirInspectorContent";
import {
  getSidebarKeyboardResizeDelta,
  getSidebarPointerResizeDelta,
  resolveSidebarDockSide,
  type SidebarDockSide,
} from "./tafsir-sidebar-resize";

interface TafsirDockedSidebarProps {
  isOpen: boolean;
  width: number;
  minWidth: number;
  maxWidth: number;
  onWidthChange: (width: number) => void;
  scopeMode: TafsirScopeMode;
  onScopeModeChange: (mode: TafsirScopeMode) => void;
  followMode: TafsirFollowMode;
  onToggleFollowMode: () => void;
  scope: TafsirScope | null;
  selectedTafsirId: number;
  onSelectTafsirId: (id: number) => void;
  onClose: () => void;
  onPlayVerse: (verseKey: string) => void;
  onJumpToVerse: (verseKey: string) => void;
  hasRangeScope: boolean;
  hasPageScope: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function TafsirDockedSidebar({
  isOpen,
  width,
  minWidth,
  maxWidth,
  onWidthChange,
  scopeMode,
  onScopeModeChange,
  followMode,
  onToggleFollowMode,
  scope,
  selectedTafsirId,
  onSelectTafsirId,
  onClose,
  onPlayVerse,
  onJumpToVerse,
  hasRangeScope,
  hasPageScope,
}: TafsirDockedSidebarProps) {
  const { t, locale, dir } = useI18n();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; width: number; dockSide: SidebarDockSide } | null>(
    null
  );
  const [isResourceOpen, setIsResourceOpen] = useState(false);
  const [resourceSearch, setResourceSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [tafsirFontSize, setTafsirFontSize] = useState("text-[1.5rem]");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fontSizes = useMemo(() => [
    { label: locale === 'ar' ? "صغير جداً" : "X-Small", value: "text-[1.1rem]" },
    { label: locale === 'ar' ? "صغير" : "Small", value: "text-[1.3rem]" },
    { label: locale === 'ar' ? "متوسط" : "Medium", value: "text-[1.5rem]" },
    { label: locale === 'ar' ? "كبير" : "Large", value: "text-[1.7rem]" },
    { label: locale === 'ar' ? "كبير جداً" : "X-Large", value: "text-[1.9rem]" },
  ], [locale]);

  const availableTafsirs = useMemo(
    () => Object.values(TAFSIR_RESOURCES).filter((resource) => resource.language === locale),
    [locale]
  );

  useEffect(() => {
    if (availableTafsirs.some((resource) => resource.id === selectedTafsirId)) return;
    if (availableTafsirs[0]) {
      onSelectTafsirId(availableTafsirs[0].id);
    }
  }, [availableTafsirs, onSelectTafsirId, selectedTafsirId]);

  const getDockSide = (): SidebarDockSide => {
    const rect = sidebarRef.current?.getBoundingClientRect();
    if (!rect) return "right";
    return resolveSidebarDockSide(rect, window.innerWidth);
  };

  const handleResizeStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    resizeStartRef.current = {
      x: event.clientX,
      width,
      dockSide: getDockSide(),
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!resizeStartRef.current) return;
      const delta = getSidebarPointerResizeDelta(
        resizeStartRef.current.x,
        moveEvent.clientX,
        resizeStartRef.current.dockSide
      );
      onWidthChange(clamp(resizeStartRef.current.width + delta, minWidth, maxWidth));
    };

    const onPointerUp = () => {
      resizeStartRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleResizeKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const step = 12;
    const delta = getSidebarKeyboardResizeDelta(event.key, step, getDockSide());
    onWidthChange(clamp(width + delta, minWidth, maxWidth));
  };

  const tabs: Array<{ key: TafsirScopeMode; enabled: boolean; label: string }> = [
    { key: "ayah", enabled: true, label: t.mushaf.tafsirScopeAyah },
    { key: "range", enabled: hasRangeScope, label: t.mushaf.tafsirScopeRange },
    { key: "page", enabled: hasPageScope, label: t.mushaf.tafsirScopePage },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsResourceOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTafsirs = useMemo(() => {
    return availableTafsirs.filter(r => 
      r.name.toLowerCase().includes(resourceSearch.toLowerCase())
    );
  }, [availableTafsirs, resourceSearch]);

  const selectedTafsir = useMemo(() => 
    availableTafsirs.find(r => r.id === selectedTafsirId),
    [availableTafsirs, selectedTafsirId]
  );

  if (!isOpen) {
    return null;
  }

  const dropdownNode = (
    <div className="relative shrink-0 p-1 mushaf-engraved-container flex items-center" ref={dropdownRef}>
      <button
        type="button"
        title={t.mushaf.selectTafsir}
        onClick={() => setIsResourceOpen(!isResourceOpen)}
        className="group relative flex items-center gap-2 rounded-xl bg-transparent px-3 py-1.5 hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all duration-300 outline-none cursor-pointer active:scale-[0.98]"
      >
        <BookOpen size={14} className="text-primary/70 shrink-0 group-hover:text-primary transition-colors" />
        <span className="truncate flex-1 text-[13px] font-bold text-primary/90 group-hover:text-primary pt-px transition-colors max-w-[150px]">{selectedTafsir?.name || t.common.loading}</span>
        <ChevronDown size={14} className={`text-primary/50 shrink-0 group-hover:text-primary transition-all duration-300 ${isResourceOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isResourceOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-full mt-2 w-64 z-[var(--z-context-menu)] bg-card/95 backdrop-blur-md border border-border/40 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] py-2 overflow-hidden"
            style={{ [dir === 'rtl' ? 'right' : 'left']: 0 }}
          >
            <div className="px-3 pb-2 mb-2 border-b border-border/40">
              <div className="relative mushaf-engraved-container flex items-center rounded-xl overflow-hidden focus-within:border-primary/40 focus-within:shadow-[inset_0_4px_8px_-2px_rgba(0,0,0,0.15)] transition-all duration-300">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" size={14} />
                <input 
                  autoFocus
                  type="text"
                  className="w-full h-9 bg-transparent border-none rounded-xl ltr:pl-9 rtl:pr-9 px-3 text-[13px] font-bold outline-none placeholder:text-primary/30 text-foreground"
                  placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar px-1.5 space-y-0.5">
              {filteredTafsirs.map((resource) => (
                <button
                  key={resource.id}
                  onClick={() => {
                    onSelectTafsirId(resource.id);
                    setIsResourceOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${selectedTafsirId === resource.id ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-primary/5 hover:text-foreground"}`}
                >
                  <span className="truncate">{resource.name}</span>
                  {selectedTafsirId === resource.id && <Check size={14} />}
                </button>
              ))}
              {filteredTafsirs.length === 0 && (
                <div className="p-4 text-center text-[13px] text-muted-foreground font-medium">
                  {locale === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const panelBody = (
    <div
      data-testid="tafsir-panel-root"
      className="flex h-full min-h-0 flex-col border-s border-primary/10 bg-background shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] transition-all"
      style={{ width }}
    >
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-primary/10 bg-card/60 backdrop-blur-md"
          >
            <div className="p-5 space-y-6">
              <div>
                <label className="text-[11px] font-black text-primary/50 uppercase tracking-widest mb-3 block px-1">
                  نطاق التفسير
                </label>
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <MushafButton
                      key={tab.key}
                      variant="ghost"
                      active={scopeMode === tab.key}
                      onClick={() => onScopeModeChange(tab.key)}
                      disabled={!tab.enabled}
                      className={`h-9 px-5 text-[13px] font-black rounded-lg transition-all ${scopeMode === tab.key ? 'shadow-sm bg-primary/10 border border-primary/10' : 'bg-primary/5 border border-transparent'} disabled:opacity-30`}
                    >
                      {tab.label}
                    </MushafButton>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-primary/50 uppercase tracking-widest mb-3 block px-1">
                  حجم الخط
                </label>
                <div className="flex flex-wrap gap-2">
                  {fontSizes.map((size) => (
                    <MushafButton
                      key={size.value}
                      variant="ghost"
                      active={tafsirFontSize === size.value}
                      onClick={() => setTafsirFontSize(size.value)}
                      className={`h-9 px-4 text-[13px] font-bold rounded-lg transition-all ${tafsirFontSize === size.value ? 'shadow-sm bg-primary/10 border border-primary/10' : 'bg-primary/5 border border-transparent'} disabled:opacity-30`}
                    >
                      {size.label}
                    </MushafButton>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TafsirInspectorContent
        isOpen={isOpen}
        scope={scope}
        selectedTafsirId={selectedTafsirId}
        onPlayVerse={onPlayVerse}
        onJumpToVerse={onJumpToVerse}
        headerContent={dropdownNode}
        onToggleSettings={() => setShowSettings((prev) => !prev)}
        tafsirFontSizeClass={tafsirFontSize}
      />

      <div className="border-t border-primary/10 bg-primary/5 p-3 flex items-center justify-center gap-2 shrink-0">
        <button
          onClick={onToggleFollowMode}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className={`flex items-center justify-center w-8 h-4 rounded-full transition-colors ${followMode === "locked" ? "bg-primary" : "bg-primary/20"}`}>
            <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${followMode === "locked" ? "translate-x-[6px] rtl:-translate-x-[6px]" : "-translate-x-[6px] rtl:translate-x-[6px]"}`} />
          </div>
          <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
            {t.mushaf.follow}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div ref={sidebarRef} className="relative hidden h-full lg:flex">
      <button
        type="button"
        className="mushaf-tafsir-resizer"
        aria-label={t.mushaf.sidebarWidth}
        role="separator"
        tabIndex={0}
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        aria-valuenow={Math.round(width)}
        onPointerDown={handleResizeStart}
        onKeyDown={handleResizeKeyDown}
      />
      {panelBody}
    </div>
  );
}
