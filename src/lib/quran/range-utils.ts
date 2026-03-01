/**
 * Verse range history utilities.
 * Scope intentionally limited to history + timestamps.
 */

const RANGE_HISTORY_KEY = "quran_range_history";
const MAX_HISTORY_ITEMS = 20;

export interface RangeHistoryItem {
  id: string;
  chapterId: number;
  chapterName: string;
  fromVerse: number;
  toVerse: number;
  timestamp: number;
  useCount: number;
}

function safeGetHistory(): RangeHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RANGE_HISTORY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as RangeHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeSetHistory(items: RangeHistoryItem[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(RANGE_HISTORY_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage failures.
  }
}

export function saveRangeToHistory(
  chapterId: number,
  chapterName: string,
  fromVerse: number,
  toVerse: number
): void {
  const history = safeGetHistory();
  const existingIndex = history.findIndex(
    (item) =>
      item.chapterId === chapterId &&
      item.fromVerse === fromVerse &&
      item.toVerse === toVerse
  );

  if (existingIndex >= 0) {
    const existing = history[existingIndex];
    const updated: RangeHistoryItem = {
      ...existing,
      timestamp: Date.now(),
      useCount: existing.useCount + 1,
    };

    history.splice(existingIndex, 1);
    history.unshift(updated);
  } else {
    history.unshift({
      id: `range_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      chapterId,
      chapterName,
      fromVerse,
      toVerse,
      timestamp: Date.now(),
      useCount: 1,
    });
  }

  safeSetHistory(history.slice(0, MAX_HISTORY_ITEMS));
}

export function getRangeHistory(): RangeHistoryItem[] {
  return safeGetHistory().sort((a, b) => b.timestamp - a.timestamp);
}

export function clearRangeHistory(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(RANGE_HISTORY_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function getRelativeTime(timestamp: number, locale: "ar" | "en"): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return locale === "ar" ? "الآن" : "Just now";
  }

  if (minutes < 60) {
    return locale === "ar"
      ? `منذ ${minutes} ${minutes === 1 ? "دقيقة" : "دقائق"}`
      : `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (hours < 24) {
    return locale === "ar"
      ? `منذ ${hours} ${hours === 1 ? "ساعة" : "ساعات"}`
      : `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  return locale === "ar"
    ? `منذ ${days} ${days === 1 ? "يوم" : "أيام"}`
    : `${days} day${days === 1 ? "" : "s"} ago`;
}
