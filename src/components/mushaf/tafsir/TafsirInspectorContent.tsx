"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, MapPinned, Play, Settings } from "lucide-react";
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
  onToggleSettings?: () => void;
  headerContent?: React.ReactNode;
  tafsirFontSizeClass?: string;
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
  onToggleSettings,
  headerContent,
  tafsirFontSizeClass,
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
      <div className="sticky top-0 z-20 flex min-h-[56px] items-center gap-3 border-b border-primary/10 bg-background/80 px-4 py-3 backdrop-blur-xl shadow-sm">
        {headerContent}
        
        {entries.length > 0 && <div className="w-px h-6 rounded-full bg-primary/20 shrink-0 mx-1" />}

        {entries.length > 0 ? (
          <div className="flex flex-1 items-center gap-2 overflow-x-auto custom-scrollbar pr-2" style={{ scrollbarWidth: 'none' }}>
            {entries.map((entry) => (
              <MushafButton
                key={`nav-${entry.verseKey}`}
                variant="ghost"
                onClick={() => handleJump(entry.verseKey)}
                className="h-8 shrink-0 rounded-lg border border-primary/10 bg-primary/5 px-3 py-1 text-[13px] font-black tracking-widest shadow-sm transition-all hover:bg-primary/10 hover:border-primary/20 hover:text-primary active:scale-95 text-primary/80"
              >
                <div dir="ltr">{entry.verseKey}</div>
              </MushafButton>
            ))}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {onToggleSettings && (
          <MushafButton
            variant="icon"
            onClick={onToggleSettings}
            className="h-8 w-8 shrink-0 rounded-lg border border-primary/10 bg-primary/5 text-primary/70 shadow-sm transition-all hover:bg-primary/10 hover:border-primary/20 hover:text-primary active:scale-95"
            title={locale === "ar" ? "الإعدادات" : "Settings"}
            icon={<Settings size={16} />}
          />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-6 space-y-12">
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
            className="group relative scroll-mt-20"
          >
            <header className="flex items-center gap-3 mb-6 select-none opacity-80 transition-opacity hover:opacity-100">
              <button
                onClick={() => onPlayVerse(entry.verseKey)}
                className="flex items-center gap-2 rounded-full bg-primary/5 px-3.5 py-1.5 text-primary transition-all hover:bg-primary/10 group/btn hover:scale-105 active:scale-95"
                title={t.mushaf.audio}
              >
                <Play size={10} className="fill-current opacity-60 transition-opacity group-hover/btn:opacity-100" />
                <span className="text-sm font-black tracking-widest pt-0.5" style={{ fontFamily: 'var(--font-ui-naskh)' }} dir="ltr">
                  {entry.verseKey}
                </span>
              </button>
              
              <div className="h-px flex-1 bg-gradient-to-r from-primary/10 to-transparent" />
            </header>

            <div
              className={`prose prose-sm max-w-none px-4 ${tafsirFontSizeClass || 'text-[1.5rem]'} leading-[2.5] text-foreground/90 dark:prose-invert`}
              dir={dir}
              style={{ textAlign: dir === 'rtl' ? 'justify' : 'left', fontFamily: 'var(--font-ui-naskh)' }}
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
