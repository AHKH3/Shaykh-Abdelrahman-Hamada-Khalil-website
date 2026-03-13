"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Lock, LockOpen, ChevronDown, Check, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { TAFSIR_RESOURCES } from "@/lib/quran/api";
import type {
  TafsirFollowMode,
  TafsirScope,
  TafsirScopeMode,
} from "@/lib/hooks/useTafsirWorkspace";
import ModalShell from "@/components/ui/ModalShell";
import MushafButton from "../ui/MushafButton";
import MushafCloseButton from "../ui/MushafCloseButton";
import TafsirInspectorContent from "./TafsirInspectorContent";

interface TafsirBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  scopeMode: TafsirScopeMode;
  onScopeModeChange: (mode: TafsirScopeMode) => void;
  followMode: TafsirFollowMode;
  onToggleFollowMode: () => void;
  scope: TafsirScope | null;
  selectedTafsirId: number;
  onSelectTafsirId: (id: number) => void;
  onPlayVerse: (verseKey: string) => void;
  onJumpToVerse: (verseKey: string) => void;
  hasRangeScope: boolean;
  hasPageScope: boolean;
}

export default function TafsirBottomSheet({
  isOpen,
  onClose,
  scopeMode,
  onScopeModeChange,
  followMode,
  onToggleFollowMode,
  scope,
  selectedTafsirId,
  onSelectTafsirId,
  onPlayVerse,
  onJumpToVerse,
  hasRangeScope,
  hasPageScope,
}: TafsirBottomSheetProps) {
  const { t, locale } = useI18n();
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

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={70}
      containerClassName="flex items-end justify-center p-0 sm:p-4"
      panelClassName="w-full max-w-2xl max-h-[92vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden border border-primary/10 bg-card/95 backdrop-blur-2xl shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.2)]"
      backdropClassName="bg-black/40 backdrop-blur-sm"
    >
      <div data-testid="tafsir-panel-root" className="flex min-h-0 h-[85vh] flex-col sm:h-[78vh]">
        {/* Header Redesign */}
        <div className="relative overflow-hidden bg-primary/5 px-6 py-5 border-b border-primary/10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="mushaf-engraved-container flex h-11 w-11 items-center justify-center text-primary shadow-sm">
                <BookOpen size={22} className="drop-shadow-sm" />
              </div>
              <div>
                <p className="mushaf-text-overline font-black uppercase tracking-[0.25em] text-primary/50 leading-none mb-1.5">
                  {t.mushaf.openTafsirPanel}
                </p>
                <h3 className="font-['Amiri',serif] text-xl font-bold text-foreground leading-none">{t.mushaf.tafsir}</h3>
              </div>
            </div>
            <MushafCloseButton onClick={onClose} title={t.common.close} />
          </div>
        </div>

        <div className="space-y-4 border-b border-primary/10 bg-background/40 p-5">
           {/* Custom Resource Selector */}
           <div className="relative" ref={dropdownRef}>
            <label className="mushaf-text-overline mb-2.5 block font-black uppercase tracking-wider text-primary/60">
              {t.mushaf.selectTafsir}
            </label>
            
            <button
              type="button"
              onClick={() => setIsResourceOpen(!isResourceOpen)}
              className="flex h-12 w-full items-center justify-between gap-3 border border-primary/10 bg-card rounded-2xl px-5 text-sm font-bold shadow-sm transition-all hover:bg-primary/5 hover:border-primary/20 active:scale-[0.98] outline-none"
            >
              <span className="truncate text-primary">{selectedTafsir?.name || t.common.loading}</span>
              <ChevronDown size={16} className={`transition-transform duration-300 text-primary/60 ${isResourceOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isResourceOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-full left-0 right-0 mt-3 z-[var(--z-context-menu)] bg-card/95 backdrop-blur-2xl border border-primary/10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden"
                >
                  <div className="p-3 border-b border-primary/5">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
                      <input 
                        autoFocus
                        type="text"
                        className="w-full h-11 bg-primary/5 border-none rounded-xl ps-11 pe-5 text-sm font-bold outline-none placeholder:text-primary/30"
                        placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                        value={resourceSearch}
                        onChange={(e) => setResourceSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-1.5">
                    {filteredTafsirs.map((resource) => (
                      <button
                        key={resource.id}
                        onClick={() => {
                          onSelectTafsirId(resource.id);
                          setIsResourceOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all hover:bg-primary/5 group ${selectedTafsirId === resource.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"}`}
                      >
                        <span className="truncate">{resource.name}</span>
                        {selectedTafsirId === resource.id && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {tabs.map((tab) => (
              <MushafButton
                key={tab.key}
                variant="ghost"
                active={scopeMode === tab.key}
                onClick={() => onScopeModeChange(tab.key)}
                disabled={!tab.enabled}
                className={`h-10 px-5 mushaf-text-compact font-black rounded-xl transition-all ${scopeMode === tab.key ? 'shadow-sm bg-primary/10' : 'bg-primary/5'} disabled:opacity-30`}
              >
                {tab.label}
              </MushafButton>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <MushafButton
                variant={followMode === "locked" ? "primary" : "ghost"}
                onClick={onToggleFollowMode}
                icon={followMode === "locked" ? <Lock size={16} /> : <LockOpen size={16} />}
                className={`h-10 px-5 mushaf-text-compact font-black rounded-xl transition-all ${followMode === "locked" ? 'shadow-md ring-4 ring-primary/10' : 'bg-primary/5'}`}
              >
                {followMode === "locked" ? t.mushaf.unlock : t.mushaf.lock}
              </MushafButton>
              <span className="mushaf-text-overline font-black uppercase tracking-widest text-primary/40">
                {followMode === "locked" ? t.mushaf.lock : t.mushaf.follow}
              </span>
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
    </ModalShell>
  );
}
