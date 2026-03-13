"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, MapPinned, Play } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { TafsirScope } from "@/lib/hooks/useTafsirWorkspace";
import {
  loadScopeTafsir,
  prefetchScopeChunk,
  type ScopeTafsirEntry,
} from "@/lib/quran/tafsir-service";
import MushafButton from "../ui/MushafButton";

interface TafsirInspectorContentProps {
  isOpen: boolean;
  scope: TafsirScope | null;
  selectedTafsirId: number;
  onPlayVerse: (verseKey: string) => void;
  onJumpToVerse: (verseKey: string) => void;
}

function verseAnchorId(verseKey: string): string {
  return `tafsir-verse-${verseKey.replace(":", "-")}`;
}

export default function TafsirInspectorContent({
  isOpen,
  scope,
  selectedTafsirId,
  onPlayVerse,
  onJumpToVerse,
}: TafsirInspectorContentProps) {
  const { t, locale, dir } = useI18n();
  const requestControllerRef = useRef<AbortController | null>(null);
  const [entries, setEntries] = useState<ScopeTafsirEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const isRangeScope = scope?.mode === "range";

  const resetState = useCallback(() => {
    setEntries([]);
    setError(null);
    setNextOffset(0);
    setHasMore(false);
  }, []);

  const loadChunk = useCallback(
    async (initial: boolean, startOffset: number) => {
      if (!scope) {
        resetState();
        return;
      }

      if (requestControllerRef.current) {
        requestControllerRef.current.abort();
      }

      const controller = new AbortController();
      requestControllerRef.current = controller;
      setLoading(true);
      if (initial) {
        setError(null);
      }

      try {
        const result = await loadScopeTafsir({
          scope,
          tafsirId: selectedTafsirId,
          offset: initial ? 0 : startOffset,
          chunkSize: 20,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setEntries((prev) => (initial ? result.entries : [...prev, ...result.entries]));
        setNextOffset(result.nextOffset);
        setHasMore(result.hasMore);
        setError(null);
      } catch (loadError) {
        if (controller.signal.aborted) return;

        const message =
          loadError instanceof Error
            ? loadError.message
            : locale === "ar"
              ? "تعذر تحميل التفسير"
              : "Unable to load tafsir";
        setError(message);
      } finally {
        if (requestControllerRef.current === controller) {
          setLoading(false);
          requestControllerRef.current = null;
        }
      }
    },
    [locale, resetState, scope, selectedTafsirId]
  );

  useEffect(() => {
    if (!isOpen) return;
    void loadChunk(true, 0);
  }, [isOpen, loadChunk]);

  useEffect(() => {
    return () => {
      if (requestControllerRef.current) {
        requestControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !scope || scope.mode !== "range" || !hasMore || entries.length === 0 || loading) {
      return;
    }

    void prefetchScopeChunk({
      scope,
      tafsirId: selectedTafsirId,
      offset: nextOffset,
      chunkSize: 20,
    }).catch(() => undefined);
  }, [entries.length, hasMore, isOpen, loading, nextOffset, scope, selectedTafsirId]);

  const emptyMessage = useMemo(() => {
    if (!scope) {
      return locale === "ar" ? "اختر آية لعرض التفسير" : "Select a verse to view tafsir";
    }

    if (scope.mode === "ayah" && !scope.verseKey) {
      return t.mushaf.noVerseSelected;
    }

    return locale === "ar" ? "لا توجد بيانات تفسير متاحة" : "No tafsir data available";
  }, [locale, scope, t.mushaf.noVerseSelected]);

  const handleJump = useCallback(
    (verseKey: string) => {
      onJumpToVerse(verseKey);
      const target = document.getElementById(verseAnchorId(verseKey));
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [onJumpToVerse]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background" dir={dir}>
      {entries.length > 0 ? (
        <div className="sticky top-0 z-10 border-b border-primary/10 bg-card/60 px-3 py-2 backdrop-blur-xl">
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {entries.map((entry) => (
              <MushafButton
                key={`nav-${entry.verseKey}`}
                variant="ghost"
                onClick={() => handleJump(entry.verseKey)}
                className="h-auto flex-shrink-0 rounded-xl border border-primary/10 bg-primary/5 px-3 py-1.5 mushaf-text-compact font-black shadow-sm transition-all hover:bg-primary/10 hover:border-primary/20 active:scale-95"
              >
                {entry.verseKey}
              </MushafButton>
            ))}
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
        {loading && entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 size={26} className="animate-spin text-primary" />
            <p className="text-sm">{t.common.loading}</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p className="flex items-center gap-2 font-semibold">
              <AlertCircle size={16} />
              {locale === "ar" ? "تعذر تحميل المحتوى" : "Unable to load content"}
            </p>
            <p className="mushaf-text-meta mt-1 opacity-90">{error}</p>
            <MushafButton
              variant="ghost"
              onClick={() => void loadChunk(true, 0)}
              className="mt-3 h-auto rounded-lg border border-destructive/20 px-3 py-1.5 mushaf-text-compact"
            >
              {t.common.retry}
            </MushafButton>
          </div>
        ) : null}

        {!loading && !error && entries.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : null}

        {entries.map((entry) => (
          <article
            id={verseAnchorId(entry.verseKey)}
            key={entry.verseKey}
            className="group relative rounded-3xl border border-primary/10 bg-card/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-sm overflow-hidden"
          >
            <header className="flex items-center justify-between gap-3 bg-primary/[0.03] px-5 py-3 relative">
              {/* Refined Verse Key Tag */}
              <div className="mushaf-engraved-container flex items-center justify-center px-4 py-1.5 min-w-[70px]">
                <span className="relative z-10 text-sm font-black text-primary tracking-wider" dir="ltr">
                  {entry.verseKey}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MushafButton
                  variant="icon"
                  onClick={() => onPlayVerse(entry.verseKey)}
                  className="h-9 w-9 p-0 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary transition-all active:scale-90"
                  title={t.mushaf.audio}
                  icon={<Play size={16} className="fill-current" />}
                />
                <MushafButton
                  variant="icon"
                  onClick={() => handleJump(entry.verseKey)}
                  className="h-9 w-9 p-0 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary transition-all active:scale-90"
                  title={locale === "ar" ? "الانتقال للآية" : "Jump to verse"}
                  icon={<MapPinned size={16} />}
                />
              </div>
            </header>
            <div
              className="prose prose-sm max-w-none p-6 font-['Amiri',serif] text-xl leading-[2.5] text-foreground/90 dark:prose-invert selection:bg-primary/20"
              dir={dir}
              style={{ textAlign: dir === 'rtl' ? 'justify' : 'left' }}
              dangerouslySetInnerHTML={{ __html: entry.tafsir.text }}
            />
          </article>
        ))}

        {isRangeScope && hasMore ? (
          <div className="pt-1">
            <MushafButton
              variant="ghost"
              onClick={() => void loadChunk(false, nextOffset)}
              className="w-full rounded-xl border border-primary/10 bg-primary/5 py-2.5"
              disabled={loading}
            >
              {loading ? t.common.loading : t.mushaf.loadMore}
            </MushafButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}
