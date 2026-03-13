"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Lock, LockOpen, ChevronDown, Check, Search } from "lucide-react";
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
  const { t, locale } = useI18n();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; width: number; dockSide: SidebarDockSide } | null>(
    null
  );
  const [isResourceOpen, setIsResourceOpen] = useState(false);
  const [resourceSearch, setResourceSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const panelBody = (
    <div
      data-testid="tafsir-panel-root"
      className="flex h-full min-h-0 flex-col border-s border-primary/10 bg-card/95 backdrop-blur-xl shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.1)] transition-all"
      style={{ width }}
    >
      {/* Header Overhaul */}
      <div className="relative overflow-hidden bg-primary/5 px-4 py-4 border-b border-primary/10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="mushaf-engraved-container flex h-10 w-10 items-center justify-center text-primary shadow-sm">
              <BookOpen size={20} className="drop-shadow-sm" />
            </div>
            <div className="min-w-0">
              <p className="mushaf-text-overline font-black uppercase tracking-[0.2em] text-primary/50 leading-none mb-1">
                {t.mushaf.openTafsirPanel}
              </p>
              <h3 className="font-['Amiri',serif] text-xl font-bold text-foreground leading-none">{t.mushaf.tafsir}</h3>
            </div>
          </div>
          <MushafCloseButton onClick={onClose} title={t.common.close} />
        </div>
      </div>

      <div className="space-y-4 border-b border-primary/10 bg-background/40 p-4">
        {/* Resource Selector Overhaul */}
        <div className="relative" ref={dropdownRef}>
          <label className="mushaf-text-overline mb-2 block font-black uppercase tracking-wider text-primary/60">
            {t.mushaf.selectTafsir}
          </label>
          
          <button
            type="button"
            onClick={() => setIsResourceOpen(!isResourceOpen)}
            className="flex h-11 w-full items-center justify-between gap-2 border border-primary/10 bg-card rounded-xl px-4 text-sm font-bold shadow-sm transition-all hover:bg-primary/5 hover:border-primary/20 active:scale-[0.98] outline-none"
          >
            <span className="truncate text-primary">{selectedTafsir?.name || t.common.loading}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 text-primary/60 ${isResourceOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {isResourceOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-2 z-[var(--z-context-menu)] bg-card/95 backdrop-blur-2xl border border-primary/10 rounded-2xl shadow-[0_15px_50px_-15px_rgba(0,0,0,0.3)] overflow-hidden"
              >
                <div className="p-2 border-b border-primary/5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" size={14} />
                    <input 
                      autoFocus
                      type="text"
                      className="w-full h-9 bg-primary/5 border-none rounded-lg ps-9 pe-4 mushaf-text-compact font-bold outline-none placeholder:text-primary/30"
                      placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                      value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                  {filteredTafsirs.map((resource) => (
                    <button
                      key={resource.id}
                      onClick={() => {
                        onSelectTafsirId(resource.id);
                        setIsResourceOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-primary/5 group ${selectedTafsirId === resource.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"}`}
                    >
                      <span className="truncate">{resource.name}</span>
                      {selectedTafsirId === resource.id && <Check size={14} />}
                    </button>
                  ))}
                  {filteredTafsirs.length === 0 && (
                    <div className="p-4 text-center mushaf-text-compact text-muted-foreground font-medium">
                      {locale === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Improved Controls */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <MushafButton
                key={tab.key}
                variant="ghost"
                active={scopeMode === tab.key}
                onClick={() => onScopeModeChange(tab.key)}
                disabled={!tab.enabled}
                className={`h-9 px-4 mushaf-text-compact font-black rounded-lg transition-all ${scopeMode === tab.key ? 'shadow-sm bg-primary/10' : 'bg-primary/5'} disabled:opacity-30`}
              >
                {tab.label}
              </MushafButton>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
               <MushafButton
                variant={followMode === "locked" ? "primary" : "ghost"}
                onClick={onToggleFollowMode}
                icon={followMode === "locked" ? <Lock size={14} /> : <LockOpen size={14} />}
                className={`h-9 px-4 mushaf-text-compact font-black rounded-lg transition-all ${followMode === "locked" ? 'shadow-md ring-4 ring-primary/10' : 'bg-primary/5'}`}
              >
                {followMode === "locked" ? t.mushaf.unlock : t.mushaf.lock}
              </MushafButton>
              <span className="mushaf-text-overline font-black uppercase tracking-widest text-primary/40">
                {followMode === "locked" ? t.mushaf.lock : t.mushaf.follow}
              </span>
            </div>
          </div>
        </div>
      </div>

      <TafsirInspectorContent
        isOpen={isOpen}
        scope={scope}
        selectedTafsirId={selectedTafsirId}
        onPlayVerse={onPlayVerse}
        onJumpToVerse={onJumpToVerse}
      />
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
