/**
 * Local Quran search engine — Arabic-aware exact substring matching.
 * 100% client-side, zero network calls after initial data load.
 */

import { loadVerseIndex, getVersesByChapter, getVersesByJuz, getCachedVerses, isIndexAvailable, clearVerseIndex, type VerseIndex } from './verse-index';

export interface LocalSearchOptions {
    query: string;
    chapterId?: number;
    juzNumber?: number;
    limit?: number;
}

export interface LocalSearchResult {
    verse_key: string;
    text: string;
    highlighted: string;
    score: number;
    chapter_id: number;
    verse_number: number;
    page_number: number;
    juz_number: number;
}

// Arabic diacritics (tashkeel) regex — same as in the generator script
const TASHKEEL_RE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/g;
const QURAN_MARKS_RE = /[\u06D6-\u06ED\u0615-\u061A]/g;

/**
 * Normalize Arabic text for search matching.
 * Strips diacritics, normalizes alef/hamza variants, taa marbuta, alef maqsura.
 */
function normalizeArabic(text: string): string {
    return text
        .replace(TASHKEEL_RE, '')
        .replace(QURAN_MARKS_RE, '')
        .replace(/[إأآٱ]/g, 'ا')  // Alef variants → Alef
        .replace(/ة/g, 'ه')        // Taa marbuta → Haa
        .replace(/ى/g, 'ي')        // Alef maqsura → Yaa
        .replace(/\s+/g, ' ')      // Collapse whitespace
        .trim();
}

/**
 * Highlight matching text in a verse.
 * Finds all occurrences of the query in the original text (with diacritics)
 * by comparing normalized positions.
 */
function highlightMatch(originalText: string, normalizedQuery: string): string {
    const normalizedText = normalizeArabic(originalText);

    // Build a mapping from normalized index to original index
    // We need to find where the match is in the original text
    const matchPositions: Array<[number, number]> = [];
    let searchFrom = 0;

    while (true) {
        const idx = normalizedText.indexOf(normalizedQuery, searchFrom);
        if (idx === -1) break;

        // Map normalized positions back to original text positions
        const origStart = mapNormalizedToOriginal(originalText, idx);
        const origEnd = mapNormalizedToOriginal(originalText, idx + normalizedQuery.length);

        matchPositions.push([origStart, origEnd]);
        searchFrom = idx + 1;

        // Safety: avoid infinite loops
        if (matchPositions.length > 10) break;
    }

    if (matchPositions.length === 0) return originalText;

    // Build highlighted string (process from end to avoid offset issues)
    let result = originalText;
    for (let i = matchPositions.length - 1; i >= 0; i--) {
        const [start, end] = matchPositions[i];
        const before = result.slice(0, start);
        const match = result.slice(start, end);
        const after = result.slice(end);
        result = `${before}<mark>${match}</mark>${after}`;
    }

    return result;
}

/**
 * Map a position in normalized text back to the original text position.
 */
function mapNormalizedToOriginal(original: string, normalizedPos: number): number {
    let normIdx = 0;
    let origIdx = 0;

    // Walk through original text character by character
    while (origIdx < original.length && normIdx < normalizedPos) {
        const origChar = original[origIdx];
        // Check if this character survives normalization
        const normalizedChar = normalizeArabic(origChar);
        if (normalizedChar.length > 0) {
            normIdx++;
        }
        origIdx++;
    }

    return origIdx;
}

/**
 * Search verses locally using exact substring matching on normalized Arabic text.
 */
export async function searchVersesLocally(options: LocalSearchOptions): Promise<{
    results: LocalSearchResult[];
    totalResults: number;
}> {
    const { query, chapterId, juzNumber, limit = 50 } = options;

    if (!query || query.trim().length < 2) {
        return { results: [], totalResults: 0 };
    }

    try {
        // Ensure data is loaded
        await loadVerseIndex();

        // Get the search scope
        let verses: VerseIndex[];
        if (chapterId) {
            verses = getVersesByChapter(chapterId);
        } else if (juzNumber) {
            verses = getVersesByJuz(juzNumber);
        } else {
            verses = getCachedVerses();
        }

        // Normalize the search query
        const normalizedQuery = normalizeArabic(query.trim());

        if (!normalizedQuery) {
            return { results: [], totalResults: 0 };
        }

        // Exact substring matching on pre-normalized text
        const matchingVerses: LocalSearchResult[] = [];

        for (const verse of verses) {
            // Search in pre-normalized text (tn field) for speed
            const idx = verse.tn.indexOf(normalizedQuery);
            if (idx !== -1) {
                // Calculate a relevance score:
                // - Shorter verses with matches are more relevant
                // - Matches at the start score higher
                const positionScore = idx === 0 ? 100 : Math.max(50, 90 - (idx / verse.tn.length) * 40);
                const lengthScore = Math.max(10, 100 - verse.tn.length / 5);
                const score = (positionScore * 0.6) + (lengthScore * 0.4);

                matchingVerses.push({
                    verse_key: verse.id,
                    text: verse.t,
                    highlighted: highlightMatch(verse.t, normalizedQuery),
                    score,
                    chapter_id: verse.c,
                    verse_number: verse.v,
                    page_number: verse.p,
                    juz_number: verse.j,
                });
            }
        }

        // Sort by score (descending)
        matchingVerses.sort((a, b) => b.score - a.score);

        // Limit results
        const limitedResults = matchingVerses.slice(0, limit);

        return {
            results: limitedResults,
            totalResults: matchingVerses.length,
        };
    } catch (error) {
        console.error('Error in local search:', error);
        return { results: [], totalResults: 0 };
    }
}

/**
 * Check if local search is ready (data is loaded).
 */
export function isLocalSearchReady(): boolean {
    return isIndexAvailable();
}

/**
 * Reset the local search cache.
 */
export function resetLocalSearchCache(): void {
    clearVerseIndex();
}
