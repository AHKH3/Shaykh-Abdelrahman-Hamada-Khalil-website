"use client";

import { useEffect, useMemo, useRef } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
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

interface TafsirDockedSidebarProps {
  isOpen: boolean;
  mode: "docked" | "sheet";
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
  mode,
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
  const resizeStartRef = useRef<{ x: number; width: number } | null>(null);

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

  const handleResizeStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (mode !== "docked") return;

    resizeStartRef.current = {
      x: event.clientX,
      width,
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!resizeStartRef.current) return;
      const delta = resizeStartRef.current.x - moveEvent.clientX;
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
    const delta = event.key === "ArrowLeft" ? step : -step;
    onWidthChange(clamp(width + delta, minWidth, maxWidth));
  };

  if (!isOpen) {
    return null;
  }

  const tabs: Array<{ key: TafsirScopeMode; enabled: boolean; label: string }> = [
    { key: "ayah", enabled: true, label: t.mushaf.tafsirScopeAyah },
    { key: "range", enabled: hasRangeScope, label: t.mushaf.tafsirScopeRange },
    { key: "page", enabled: hasPageScope, label: t.mushaf.tafsirScopePage },
  ];

  const panelBody = (
    <div
      data-testid="tafsir-panel-root"
      className="flex h-full min-h-0 flex-col border-s border-primary/10 bg-card/95 backdrop-blur-xl"
      style={mode === "docked" ? { width } : undefined}
    >
      <div className="flex items-center justify-between border-b border-primary/10 bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen size={16} />
          </div>
          <div className="min-w-0">
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
  );

  if (mode === "sheet") {
    return (
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        zIndex={70}
        containerClassName="flex h-full items-stretch justify-end p-0"
        panelClassName="h-full w-full max-w-[min(92vw,520px)]"
        backdropClassName="bg-black/35"
      >
        {panelBody}
      </ModalShell>
    );
  }

  return (
    <div className="relative hidden h-full xl:flex">
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
