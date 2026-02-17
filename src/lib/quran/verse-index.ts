/**
 * Verse data loader — loads all Quran verses from the static JSON file.
 * No IndexedDB, no external APIs. Simple in-memory cache.
 */

export interface VerseIndex {
    id: string;        // verse_key e.g. "1:1"
    t: string;         // text_uthmani (with diacritics)
    tn: string;        // normalized text (stripped diacritics, for searching)
    c: number;         // chapter_id
    v: number;         // verse_number
    p: number;         // page_number
    j: number;         // juz_number
}

interface QuranData {
    verses: VerseIndex[];
}

// In-memory cache
let cachedVerses: VerseIndex[] | null = null;
let loadingPromise: Promise<VerseIndex[]> | null = null;

/**
 * Load all verses from the static JSON file.
 * Cached in memory after first load.
 */
export async function loadVerseIndex(): Promise<VerseIndex[]> {
    if (cachedVerses) return cachedVerses;

    // Prevent duplicate fetches if called concurrently
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        try {
            const res = await fetch('/data/quran-data.json');
            if (!res.ok) throw new Error(`Failed to load Quran data: ${res.status}`);
            const data: QuranData = await res.json();
            cachedVerses = data.verses;
            return cachedVerses;
        } catch (error) {
            loadingPromise = null; // Allow retry on failure
            throw error;
        }
    })();

    return loadingPromise;
}

/**
 * Check if the verse index is loaded and ready.
 */
export function isIndexAvailable(): boolean {
    return cachedVerses !== null && cachedVerses.length > 0;
}

/**
 * Get all cached verses (must call loadVerseIndex first).
 */
export function getCachedVerses(): VerseIndex[] {
    return cachedVerses || [];
}

/**
 * Get verses filtered by chapter.
 */
export function getVersesByChapter(chapterId: number): VerseIndex[] {
    const verses = getCachedVerses();
    return verses
        .filter(v => v.c === chapterId)
        .sort((a, b) => a.v - b.v);
}

/**
 * Get verses filtered by juz.
 */
export function getVersesByJuz(juzNumber: number): VerseIndex[] {
    const verses = getCachedVerses();
    return verses
        .filter(v => v.j === juzNumber)
        .sort((a, b) => {
            if (a.c !== b.c) return a.c - b.c;
            return a.v - b.v;
        });
}

/**
 * Get verses filtered by page.
 */
export function getVersesByPage(pageNumber: number): VerseIndex[] {
    const verses = getCachedVerses();
    return verses
        .filter(v => v.p === pageNumber)
        .sort((a, b) => {
            if (a.c !== b.c) return a.c - b.c;
            return a.v - b.v;
        });
}

/**
 * Clear cached data (for testing or memory management).
 */
export function clearVerseIndex(): void {
    cachedVerses = null;
    loadingPromise = null;
}
