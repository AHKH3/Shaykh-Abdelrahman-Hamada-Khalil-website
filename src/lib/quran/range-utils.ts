/**
 * Utility functions for verse range calculations
 */

import type { Chapter, Verse } from "./api";

// Storage key for last viewed verses
const LAST_VIEWED_KEY = "last_viewed_verses";
const TODAY_SESSION_KEY = "today_session_range";

// Phase 4: Storage keys for smart features
const RANGE_HISTORY_KEY = "quran_range_history";
const FAVORITE_RANGES_KEY = "quran_favorite_ranges";
const PINNED_RANGES_KEY = "quran_pinned_ranges";

export interface RangePreset {
    id: string;
    labelAr: string;
    labelEn: string;
    icon: string;
    getRange: (context: RangeContext) => { chapterId: number; from: number; to: number } | null;
}

export interface RangeContext {
    currentPage: number;
    currentChapterId?: number;
    currentVerseNumber?: number;
    chapters: Chapter[];
    verses: Verse[];
}

export interface LastViewedVerse {
    verseKey: string;
    chapterId: number;
    verseNumber: number;
    timestamp: number;
}

export interface TodaySession {
    chapterId: number;
    fromVerse: number;
    toVerse: number;
    date: string;
}

/**
 * Get page info for a verse
 */
export function getPageForVerse(chapterId: number, verseNumber: number, chapters: Chapter[]): number {
    // This is a simplified calculation - in production, you'd use the actual page mapping
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return 1;

    // Approximate page based on verse count
    // In real implementation, this would use the actual page data from quran-data.json
    return 1;
}

/**
 * Get verses on a specific page
 */
export function getVersesOnPage(pageNumber: number, verses: Verse[]): Verse[] {
    return verses.filter(v => v.page_number === pageNumber);
}

/**
 * Get all verses in a juz
 */
export function getVersesInJuz(juzNumber: number, verses: Verse[]): Verse[] {
    return verses.filter(v => v.juz_number === juzNumber);
}

/**
 * Get all verses in a hizb (half juz)
 */
export function getVersesInHizb(hizbNumber: number, verses: Verse[]): Verse[] {
    // Hizb is quarter of juz, so we need to check hizb_number or calculate from juz
    return verses.filter(v => {
        // Each juz has 2 hizbs, so hizb 1-2 = juz 1, hizb 3-4 = juz 2, etc.
        const verseHizb = ((v.juz_number - 1) * 2) + 1;
        return verseHizb === hizbNumber || verseHizb + 1 === hizbNumber;
    });
}

/**
 * Save last viewed verse
 */
export function saveLastViewedVerse(verseKey: string, chapterId: number, verseNumber: number): void {
    try {
        const data: LastViewedVerse = {
            verseKey,
            chapterId,
            verseNumber,
            timestamp: Date.now(),
        };
        localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Failed to save last viewed verse:", error);
    }
}

/**
 * Get last viewed verses (last 5)
 */
export function getLastViewedVerses(): LastViewedVerse[] {
    try {
        // For now, return single last viewed verse
        const data = localStorage.getItem(LAST_VIEWED_KEY);
        if (data) {
            return [JSON.parse(data)];
        }
    } catch (error) {
        console.error("Failed to get last viewed verses:", error);
    }
    return [];
}

/**
 * Save today's session range
 */
export function saveTodaySession(chapterId: number, fromVerse: number, toVerse: number): void {
    try {
        const data: TodaySession = {
            chapterId,
            fromVerse,
            toVerse,
            date: new Date().toDateString(),
        };
        localStorage.setItem(TODAY_SESSION_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Failed to save today session:", error);
    }
}

/**
 * Get today's session range
 */
export function getTodaySession(): TodaySession | null {
    try {
        const data = localStorage.getItem(TODAY_SESSION_KEY);
        if (data) {
            const session: TodaySession = JSON.parse(data);
            // Only return if it's from today
            if (session.date === new Date().toDateString()) {
                return session;
            }
        }
    } catch (error) {
        console.error("Failed to get today session:", error);
    }
    return null;
}

/**
 * Get current juz from verses
 */
export function getCurrentJuz(verses: Verse[]): number | null {
    if (verses.length === 0) return null;
    return verses[0].juz_number;
}

/**
 * Get current hizb from verses (calculated from juz)
 */
export function getCurrentHizb(verses: Verse[]): number | null {
    if (verses.length === 0) return null;
    const juz = verses[0].juz_number;
    // Each juz has 2 hizbs
    return ((juz - 1) * 2) + 1;
}

/**
 * Calculate next range (same size, moved forward)
 */
export function getNextRange(
    chapterId: number,
    fromVerse: number,
    toVerse: number,
    chapters: Chapter[]
): { chapterId: number; from: number; to: number } | null {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return null;

    const rangeSize = toVerse - fromVerse + 1;
    const newFrom = toVerse + 1;
    const newTo = newFrom + rangeSize - 1;

    // Check if we can fit the range in current chapter
    if (newTo <= chapter.verses_count) {
        return { chapterId, from: newFrom, to: newTo };
    }

    // Move to next surah
    const nextChapter = chapters.find(c => c.id === chapterId + 1);
    if (nextChapter) {
        const adjustedTo = Math.min(rangeSize, nextChapter.verses_count);
        return { chapterId: nextChapter.id, from: 1, to: adjustedTo };
    }

    return null;
}

/**
 * Calculate previous range (same size, moved backward)
 */
export function getPrevRange(
    chapterId: number,
    fromVerse: number,
    toVerse: number,
    chapters: Chapter[]
): { chapterId: number; from: number; to: number } | null {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return null;

    const rangeSize = toVerse - fromVerse + 1;
    const newTo = fromVerse - 1;
    const newFrom = newTo - rangeSize + 1;

    // Check if we can fit the range in current chapter
    if (newFrom >= 1) {
        return { chapterId, from: newFrom, to: newTo };
    }

    // Move to previous surah
    const prevChapter = chapters.find(c => c.id === chapterId - 1);
    if (prevChapter) {
        const newFromPrev = Math.max(1, prevChapter.verses_count - rangeSize + 1);
        return { chapterId: prevChapter.id, from: newFromPrev, to: prevChapter.verses_count };
    }

    return null;
}

/**
 * Get next surah start
 */
export function getNextSurahStart(currentChapterId: number, chapters: Chapter[]): { chapterId: number; from: number; to: number } | null {
    const nextChapter = chapters.find(c => c.id === currentChapterId + 1);
    if (nextChapter) {
        // Return first 10 verses or whole surah if shorter
        const to = Math.min(10, nextChapter.verses_count);
        return { chapterId: nextChapter.id, from: 1, to };
    }
    return null;
}

/**
 * Get previous surah start
 */
export function getPrevSurahStart(currentChapterId: number, chapters: Chapter[]): { chapterId: number; from: number; to: number } | null {
    const prevChapter = chapters.find(c => c.id === currentChapterId - 1);
    if (prevChapter) {
        // Return first 10 verses or whole surah if shorter
        const to = Math.min(10, prevChapter.verses_count);
        return { chapterId: prevChapter.id, from: 1, to };
    }
    return null;
}

/**
 * Format time in mm:ss
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get first letter of Arabic text
 */
export function getFirstLetter(text: string): string {
    if (!text) return "";
    // Skip any non-Arabic characters at the start
    const arabicMatch = text.match(/[\u0600-\u06FF]/);
    return arabicMatch ? arabicMatch[0] : text[0];
}

/**
 * Get first word of Arabic text
 */
export function getFirstWord(text: string): string {
    if (!text) return "";
    // Split by spaces and get first word
    const words = text.trim().split(/\s+/);
    return words[0] || "";
}

/**
 * Convert number to Arabic numerals
 */
export function toArabicNumber(num: number): string {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().split('').map(digit => arabicNumerals[parseInt(digit)] || digit).join('');
}

/**
 * Convert Arabic numerals to Western numerals
 */
export function fromArabicNumber(str: string): number {
    const arabicToWestern: Record<string, string> = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    const westernStr = str.split('').map(char => arabicToWestern[char] || char).join('');
    return parseInt(westernStr) || 0;
}

// ============================================================================
// Phase 4: Smart Features - Range History & Favorites
// ============================================================================

export interface RangeHistoryItem {
    id: string;
    chapterId: number;
    chapterName: string;
    fromVerse: number;
    toVerse: number;
    timestamp: number;
    useCount: number;
}

export interface FavoriteRange {
    id: string;
    chapterId: number;
    chapterName: string;
    fromVerse: number;
    toVerse: number;
    note?: string;
    createdAt: number;
}

export interface PinnedRange {
    id: string;
    chapterId: number;
    chapterName: string;
    fromVerse: number;
    toVerse: number;
    pinnedAt: number;
}

/**
 * Save a range to history
 */
export function saveRangeToHistory(
    chapterId: number,
    chapterName: string,
    fromVerse: number,
    toVerse: number
): void {
    try {
        const history = getRangeHistory();
        const existingIndex = history.findIndex(
            item => item.chapterId === chapterId &&
                item.fromVerse === fromVerse &&
                item.toVerse === toVerse
        );

        if (existingIndex >= 0) {
            // Update existing entry
            history[existingIndex].timestamp = Date.now();
            history[existingIndex].useCount++;
            // Move to front
            const [updated] = history.splice(existingIndex, 1);
            history.unshift(updated);
        } else {
            // Add new entry
            const newItem: RangeHistoryItem = {
                id: `range_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                chapterId,
                chapterName,
                fromVerse,
                toVerse,
                timestamp: Date.now(),
                useCount: 1,
            };
            history.unshift(newItem);
        }

        // Keep only last 10 items
        const trimmedHistory = history.slice(0, 10);
        localStorage.setItem(RANGE_HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
        console.error("Failed to save range to history:", error);
    }
}

/**
 * Get range history
 */
export function getRangeHistory(): RangeHistoryItem[] {
    try {
        const data = localStorage.getItem(RANGE_HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to get range history:", error);
        return [];
    }
}

/**
 * Clear range history
 */
export function clearRangeHistory(): void {
    try {
        localStorage.removeItem(RANGE_HISTORY_KEY);
    } catch (error) {
        console.error("Failed to clear range history:", error);
    }
}

/**
 * Add a range to favorites
 */
export function addRangeToFavorites(
    chapterId: number,
    chapterName: string,
    fromVerse: number,
    toVerse: number,
    note?: string
): FavoriteRange {
    const favorites = getFavoriteRanges();
    const newFavorite: FavoriteRange = {
        id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chapterId,
        chapterName,
        fromVerse,
        toVerse,
        note,
        createdAt: Date.now(),
    };
    favorites.push(newFavorite);
    localStorage.setItem(FAVORITE_RANGES_KEY, JSON.stringify(favorites));
    return newFavorite;
}

/**
 * Get favorite ranges
 */
export function getFavoriteRanges(): FavoriteRange[] {
    try {
        const data = localStorage.getItem(FAVORITE_RANGES_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to get favorite ranges:", error);
        return [];
    }
}

/**
 * Remove a range from favorites
 */
export function removeRangeFromFavorites(id: string): void {
    try {
        const favorites = getFavoriteRanges();
        const filtered = favorites.filter(f => f.id !== id);
        localStorage.setItem(FAVORITE_RANGES_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error("Failed to remove range from favorites:", error);
    }
}

/**
 * Check if a range is in favorites
 */
export function isRangeFavorite(chapterId: number, fromVerse: number, toVerse: number): boolean {
    const favorites = getFavoriteRanges();
    return favorites.some(
        f => f.chapterId === chapterId &&
            f.fromVerse === fromVerse &&
            f.toVerse === toVerse
    );
}

/**
 * Pin a range
 */
export function pinRange(
    chapterId: number,
    chapterName: string,
    fromVerse: number,
    toVerse: number
): PinnedRange {
    const pinned = getPinnedRanges();
    const newPinned: PinnedRange = {
        id: `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chapterId,
        chapterName,
        fromVerse,
        toVerse,
        pinnedAt: Date.now(),
    };
    pinned.push(newPinned);
    localStorage.setItem(PINNED_RANGES_KEY, JSON.stringify(pinned));
    return newPinned;
}

/**
 * Get pinned ranges
 */
export function getPinnedRanges(): PinnedRange[] {
    try {
        const data = localStorage.getItem(PINNED_RANGES_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to get pinned ranges:", error);
        return [];
    }
}

/**
 * Unpin a range
 */
export function unpinRange(id: string): void {
    try {
        const pinned = getPinnedRanges();
        const filtered = pinned.filter(p => p.id !== id);
        localStorage.setItem(PINNED_RANGES_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error("Failed to unpin range:", error);
    }
}

/**
 * Check if a range is pinned
 */
export function isRangePinned(chapterId: number, fromVerse: number, toVerse: number): boolean {
    const pinned = getPinnedRanges();
    return pinned.some(
        p => p.chapterId === chapterId &&
            p.fromVerse === fromVerse &&
            p.toVerse === toVerse
    );
}

/**
 * Get smart suggestions based on context
 */
export interface SmartSuggestion {
    id: string;
    type: "position" | "history" | "time" | "favorite" | "bookmark";
    chapterId: number;
    fromVerse: number;
    toVerse: number;
    labelAr: string;
    labelEn: string;
    icon: string;
    priority: number;
}

export function getSmartSuggestions(
    context: RangeContext,
    chapters: Chapter[]
): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // 1. Position-based suggestions
    if (context.currentChapterId && context.currentVerseNumber) {
        const chapter = chapters.find(c => c.id === context.currentChapterId);
        if (chapter) {
            // Continue from here (next 10 verses)
            const fromVerse = context.currentVerseNumber;
            const toVerse = Math.min(fromVerse + 9, chapter.verses_count);
            if (toVerse > fromVerse) {
                suggestions.push({
                    id: `continue_${Date.now()}`,
                    type: "position",
                    chapterId: context.currentChapterId,
                    fromVerse,
                    toVerse,
                    labelAr: `متابعة ${chapter.name_arabic} ${fromVerse}-${toVerse}`,
                    labelEn: `Continue ${chapter.name_simple} ${fromVerse}-${toVerse}`,
                    icon: "📍",
                    priority: 10,
                });
            }

            // Review last 5 verses
            const reviewFrom = Math.max(1, context.currentVerseNumber - 4);
            const reviewTo = context.currentVerseNumber;
            suggestions.push({
                id: `review_${Date.now()}`,
                type: "position",
                chapterId: context.currentChapterId,
                fromVerse: reviewFrom,
                toVerse: reviewTo,
                labelAr: `مراجعة ${chapter.name_arabic} ${reviewFrom}-${reviewTo}`,
                labelEn: `Review ${chapter.name_simple} ${reviewFrom}-${reviewTo}`,
                icon: "📖",
                priority: 9,
            });
        }
    }

    // 2. Current page suggestion
    if (context.verses.length > 0) {
        const pageVerses = getVersesOnPage(context.currentPage, context.verses);
        if (pageVerses.length > 0) {
            const firstVerse = pageVerses[0];
            const lastVerse = pageVerses[pageVerses.length - 1];
            const chapter = chapters.find(c => c.id === firstVerse.chapter_id);
            if (chapter) {
                suggestions.push({
                    id: `page_${Date.now()}`,
                    type: "position",
                    chapterId: firstVerse.chapter_id,
                    fromVerse: firstVerse.verse_number,
                    toVerse: lastVerse.verse_number,
                    labelAr: `الصفحة ${context.currentPage} (${chapter.name_arabic})`,
                    labelEn: `Page ${context.currentPage} (${chapter.name_simple})`,
                    icon: "📄",
                    priority: 8,
                });
            }
        }
    }

    // 3. Current juz suggestion
    if (context.verses.length > 0) {
        const juz = getCurrentJuz(context.verses);
        if (juz) {
            const juzVerses = getVersesInJuz(juz, context.verses);
            if (juzVerses.length > 0) {
                const firstVerse = juzVerses[0];
                const lastVerse = juzVerses[juzVerses.length - 1];
                const chapter = chapters.find(c => c.id === firstVerse.chapter_id);
                if (chapter) {
                    suggestions.push({
                        id: `juz_${Date.now()}`,
                        type: "position",
                        chapterId: firstVerse.chapter_id,
                        fromVerse: firstVerse.verse_number,
                        toVerse: lastVerse.verse_number,
                        labelAr: `الجزء ${juz}`,
                        labelEn: `Juz ${juz}`,
                        icon: "📚",
                        priority: 7,
                    });
                }
            }
        }
    }

    // 4. History-based suggestions (most used)
    const history = getRangeHistory();
    history.slice(0, 3).forEach((item, index) => {
        suggestions.push({
            id: `history_${item.id}`,
            type: "history",
            chapterId: item.chapterId,
            fromVerse: item.fromVerse,
            toVerse: item.toVerse,
            labelAr: `${item.chapterName} ${item.fromVerse}-${item.toVerse}`,
            labelEn: `${item.chapterName} ${item.fromVerse}-${item.toVerse}`,
            icon: "🕐",
            priority: 6 - index,
        });
    });

    // 5. Time-based suggestions
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        // Morning - suggest short review ranges
        const lastViewed = getLastViewedVerses();
        if (lastViewed.length > 0) {
            const last = lastViewed[0];
            const chapter = chapters.find(c => c.id === last.chapterId);
            if (chapter) {
                const fromVerse = Math.max(1, last.verseNumber - 4);
                const toVerse = Math.min(chapter.verses_count, last.verseNumber + 4);
                suggestions.push({
                    id: `morning_${Date.now()}`,
                    type: "time",
                    chapterId: last.chapterId,
                    fromVerse,
                    toVerse,
                    labelAr: `مراجعة الصباح (${chapter.name_arabic})`,
                    labelEn: `Morning Review (${chapter.name_simple})`,
                    icon: "🌅",
                    priority: 5,
                });
            }
        }
    } else if (hour >= 17 && hour < 22) {
        // Evening - suggest longer review ranges
        const lastViewed = getLastViewedVerses();
        if (lastViewed.length > 0) {
            const last = lastViewed[0];
            const chapter = chapters.find(c => c.id === last.chapterId);
            if (chapter) {
                const fromVerse = Math.max(1, last.verseNumber - 9);
                const toVerse = Math.min(chapter.verses_count, last.verseNumber + 9);
                suggestions.push({
                    id: `evening_${Date.now()}`,
                    type: "time",
                    chapterId: last.chapterId,
                    fromVerse,
                    toVerse,
                    labelAr: `مراجعة المساء (${chapter.name_arabic})`,
                    labelEn: `Evening Review (${chapter.name_simple})`,
                    icon: "🌙",
                    priority: 5,
                });
            }
        }
    }

    // 6. Favorite ranges
    const favorites = getFavoriteRanges().slice(0, 3);
    favorites.forEach((item, index) => {
        suggestions.push({
            id: `fav_${item.id}`,
            type: "favorite",
            chapterId: item.chapterId,
            fromVerse: item.fromVerse,
            toVerse: item.toVerse,
            labelAr: `⭐ ${item.chapterName} ${item.fromVerse}-${item.toVerse}`,
            labelEn: `⭐ ${item.chapterName} ${item.fromVerse}-${item.toVerse}`,
            icon: "⭐",
            priority: 4 - index,
        });
    });

    // Sort by priority and return top suggestions
    return suggestions
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 8);
}

/**
 * Format range for display
 */
export function formatRange(
    chapterName: string,
    fromVerse: number,
    toVerse: number,
    locale: "ar" | "en"
): string {
    if (fromVerse === toVerse) {
        return locale === "ar"
            ? `${chapterName} ${toArabicNumber(fromVerse)}`
            : `${chapterName} ${fromVerse}`;
    }
    return locale === "ar"
        ? `${chapterName} ${toArabicNumber(fromVerse)}-${toArabicNumber(toVerse)}`
        : `${chapterName} ${fromVerse}-${toVerse}`;
}

/**
 * Get relative time string
 */
export function getRelativeTime(timestamp: number, locale: "ar" | "en"): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
        return locale === "ar" ? "الآن" : "Just now";
    } else if (minutes < 60) {
        return locale === "ar"
            ? `منذ ${toArabicNumber(minutes)} دقيقة`
            : `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return locale === "ar"
            ? `منذ ${toArabicNumber(hours)} ساعة`
            : `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days < 7) {
        return locale === "ar"
            ? `منذ ${toArabicNumber(days)} يوم`
            : `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        const date = new Date(timestamp);
        return locale === "ar"
            ? date.toLocaleDateString("ar-EG")
            : date.toLocaleDateString("en-US");
    }
}
