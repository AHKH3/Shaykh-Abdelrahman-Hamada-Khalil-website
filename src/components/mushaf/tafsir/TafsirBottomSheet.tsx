"use client";

import { useEffect, useMemo } from "react";
import { BookOpen, Lock, LockOpen } from "lucide-react";
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

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={70}
      containerClassName="flex items-end justify-center p-0 sm:p-4"
      panelClassName="w-full max-w-2xl max-h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-primary/10 bg-card shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)]"
      backdropClassName="bg-black/50"
    >
      <div data-testid="tafsir-panel-root" className="flex min-h-0 h-[80vh] flex-col sm:h-[78vh]">
        <div className="flex items-center justify-between border-b border-primary/10 bg-primary/5 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">
                {t.mushaf.openTafsirPanel}
              </p>
              <h3 className="font-['Amiri',serif] text-lg font-bold text-foreground">{t.mushaf.tafsir}</h3>
            </div>
          </div>
          <MushafCloseButton onClick={onClose} title={t.common.close} />
        </div>

        <div className="space-y-3 border-b border-primary/10 bg-background/70 p-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <MushafButton
                key={tab.key}
                variant="ghost"
                active={scopeMode === tab.key}
                onClick={() => onScopeModeChange(tab.key)}
                disabled={!tab.enabled}
                className="h-auto rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-40"
              >
                {tab.label}
              </MushafButton>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <MushafButton
              variant={followMode === "locked" ? "primary" : "ghost"}
              onClick={onToggleFollowMode}
              icon={followMode === "locked" ? <Lock size={14} /> : <LockOpen size={14} />}
              className="h-auto rounded-lg px-3 py-1.5 text-xs font-bold"
            >
              {followMode === "locked" ? t.mushaf.unlock : t.mushaf.lock}
            </MushafButton>
            <span className="text-[11px] text-muted-foreground">
              {followMode === "locked" ? t.mushaf.lock : t.mushaf.follow}
            </span>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">
              {t.mushaf.selectTafsir}
            </label>
            <select
              value={selectedTafsirId}
              onChange={(event) => onSelectTafsirId(Number(event.target.value))}
              className="h-10 w-full rounded-xl border border-border/50 bg-background px-3 text-sm font-medium outline-none transition-colors focus:ring-2 focus:ring-primary/25"
            >
              {availableTafsirs.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
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
