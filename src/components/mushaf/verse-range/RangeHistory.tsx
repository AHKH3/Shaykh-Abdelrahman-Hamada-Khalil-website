"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import {
  clearRangeHistory,
  getRangeHistory,
  getRelativeTime,
  type RangeHistoryItem,
} from "@/lib/quran/range-utils";
import { useI18n } from "@/lib/i18n/context";
import MushafButton from "../ui/MushafButton";

interface RangeHistoryProps {
  onSelectRange: (chapterId: number, from: number, to: number) => void;
}

function formatTimestamp(timestamp: number, locale: "ar" | "en") {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function RangeHistory({ onSelectRange }: RangeHistoryProps) {
  const { t, locale } = useI18n();
  const [ranges, setRanges] = useState<RangeHistoryItem[]>(() => getRangeHistory());

  const refreshRanges = useCallback(() => {
    setRanges(getRangeHistory());
  }, []);

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => refreshRanges(), 0);

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.includes("range")) {
        refreshRanges();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshRanges]);

  const sortedRanges = useMemo(
    () => [...ranges].sort((a, b) => b.timestamp - a.timestamp),
    [ranges]
  );

  if (sortedRanges.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        {locale === "ar" ? "لا يوجد سجل بعد" : "No range history yet"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {sortedRanges.map((item) => (
          <MushafButton
            key={item.id}
            variant="ghost"
            onClick={() => onSelectRange(item.chapterId, item.fromVerse, item.toVerse)}
            className="w-full border-border/40 bg-background/70 px-3 py-2.5 text-start transition-colors hover:bg-muted/35 h-auto justify-start font-normal border shadow-sm"
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground whitespace-nowrap">
                  {item.chapterName} {item.fromVerse}-{item.toVerse}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={12} />
                  <span>{getRelativeTime(item.timestamp, locale)}</span>
                  <span>•</span>
                  <span>{formatTimestamp(item.timestamp, locale)}</span>
                </div>
              </div>
            </div>
          </MushafButton>
        ))}
      </div>

      <MushafButton
        variant="ghost"
        onClick={() => {
          clearRangeHistory();
          refreshRanges();
        }}
        className="flex w-full items-center justify-center gap-2 border-border/40 bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive border shadow-sm"
      >
        <Trash2 size={13} />
        {t.mushaf.clearHistory}
      </MushafButton>
    </div>
  );
}
