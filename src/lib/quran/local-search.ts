import Fuse from 'fuse.js';
import { VerseIndex, loadVerseIndex, getVersesByChapter, getVersesByJuz } from './verse-index';

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

// Fuse.js configuration for Arabic text search
const fuseOptions = {
    keys: [
        { name: 'text_uthmani', weight: 0.7 },
        { name: 'text_imlaei', weight: 0.3 }
    ],
    threshold: 0.4, // Lower threshold = stricter matching
    distance: 100,
    minMatchCharLength: 2,
    includeScore: true,
    includeMatches: true,
    ignoreLocation: true,
    useExtendedSearch: false,
};

let fuseInstance: Fuse<VerseIndex> | null = null;
let cachedVerses: VerseIndex[] = [];

/**
 * Initialize Fuse.js with all verses
 */
async function initializeFuse(verses?: VerseIndex[]): Promise<Fuse<VerseIndex>> {
    if (fuseInstance && (!verses || verses.length === 0)) {
        return fuseInstance;
    }

    const versesToIndex = verses || cachedVerses;

    if (versesToIndex.length === 0) {
        console.log('Loading verses for local search...');
        cachedVerses = await loadVerseIndex();
    } else {
        cachedVerses = versesToIndex;
    }

    fuseInstance = new Fuse(cachedVerses, fuseOptions);
    return fuseInstance;
}

/**
 * Highlight matching text in the verse
 */
function highlightMatch(text: string, matches: any[]): string {
    if (!matches || matches.length === 0) {
        return text;
    }

    // Filter out matches without valid indices
    const validMatches = matches.filter(match =>
        match.indices && match.indices.length > 0 && match.indices[0] && Array.isArray(match.indices[0])
    );

    if (validMatches.length === 0) {
        return text;
    }

    // Sort matches by position (descending) to avoid offset issues
    const sortedMatches = [...validMatches].sort((a, b) => b.indices[0][0] - a.indices[0][0]);

    let highlighted = text;
    for (const match of sortedMatches) {
        const [start, end] = match.indices[0];
        const before = highlighted.slice(0, start);
        const matchText = highlighted.slice(start, end + 1);
        const after = highlighted.slice(end + 1);
        highlighted = `${before}<mark>${matchText}</mark>${after}`;
    }

    return highlighted;
}

/**
 * Apply filters (chapter, juz) to search results
 */
function applyFilters(results: LocalSearchResult[], chapterId?: number, juzNumber?: number): LocalSearchResult[] {
    let filtered = results;

    if (chapterId) {
        filtered = filtered.filter(r => r.chapter_id === chapterId);
    }

    if (juzNumber) {
        filtered = filtered.filter(r => r.juz_number === juzNumber);
    }

    return filtered;
}

/**
 * Search verses locally using Fuse.js
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
        // Initialize Fuse.js if not already done
        const fuse = await initializeFuse();

        // Perform search
        const fuseResults = fuse.search(query.trim());

        // Convert to LocalSearchResult format
        const results: LocalSearchResult[] = fuseResults.map(result => {
            const verse = result.item;
            const matches = result.matches?.find(m => m.key === 'text_uthmani')?.indices || [];

            return {
                verse_key: verse.id,
                text: verse.text_uthmani,
                highlighted: highlightMatch(verse.text_uthmani, [{ indices: matches }]),
                score: result.score || 0,
                chapter_id: verse.chapter_id,
                verse_number: verse.verse_number,
                page_number: verse.page_number,
                juz_number: verse.juz_number,
            };
        });

        // Apply filters
        let filteredResults = results;
        if (chapterId || juzNumber) {
            filteredResults = applyFilters(results, chapterId, juzNumber);
        }

        // Limit results
        const limitedResults = filteredResults.slice(0, limit);

        return {
            results: limitedResults,
            totalResults: filteredResults.length,
        };
    } catch (error) {
        console.error('Error in local search:', error);
        return { results: [], totalResults: 0 };
    }
}

/**
 * Search verses locally within a specific chapter
 */
export async function searchVersesInChapter(
    chapterId: number,
    query: string,
    limit: number = 50
): Promise<{
    results: LocalSearchResult[];
    totalResults: number;
}> {
    if (!query || query.trim().length < 2) {
        return { results: [], totalResults: 0 };
    }

    try {
        // Get verses for the chapter
        const chapterVerses = await getVersesByChapter(chapterId);

        if (chapterVerses.length === 0) {
            return { results: [], totalResults: 0 };
        }

        // Create a new Fuse instance for this chapter
        const fuse = new Fuse(chapterVerses, fuseOptions);
        const fuseResults = fuse.search(query.trim());

        // Convert to LocalSearchResult format
        const results: LocalSearchResult[] = fuseResults.map(result => {
            const verse = result.item;
            const matches = result.matches?.find(m => m.key === 'text_uthmani')?.indices || [];

            return {
                verse_key: verse.id,
                text: verse.text_uthmani,
                highlighted: highlightMatch(verse.text_uthmani, [{ indices: matches }]),
                score: result.score || 0,
                chapter_id: verse.chapter_id,
                verse_number: verse.verse_number,
                page_number: verse.page_number,
                juz_number: verse.juz_number,
            };
        });

        // Limit results
        const limitedResults = results.slice(0, limit);

        return {
            results: limitedResults,
            totalResults: results.length,
        };
    } catch (error) {
        console.error('Error searching in chapter:', error);
        return { results: [], totalResults: 0 };
    }
}

/**
 * Search verses locally within a specific juz
 */
export async function searchVersesInJuz(
    juzNumber: number,
    query: string,
    limit: number = 50
): Promise<{
    results: LocalSearchResult[];
    totalResults: number;
}> {
    if (!query || query.trim().length < 2) {
        return { results: [], totalResults: 0 };
    }

    try {
        // Get verses for the juz
        const juzVerses = await getVersesByJuz(juzNumber);

        if (juzVerses.length === 0) {
            return { results: [], totalResults: 0 };
        }

        // Create a new Fuse instance for this juz
        const fuse = new Fuse(juzVerses, fuseOptions);
        const fuseResults = fuse.search(query.trim());

        // Convert to LocalSearchResult format
        const results: LocalSearchResult[] = fuseResults.map(result => {
            const verse = result.item;
            const matches = result.matches?.find(m => m.key === 'text_uthmani')?.indices || [];

            return {
                verse_key: verse.id,
                text: verse.text_uthmani,
                highlighted: highlightMatch(verse.text_uthmani, [{ indices: matches }]),
                score: result.score || 0,
                chapter_id: verse.chapter_id,
                verse_number: verse.verse_number,
                page_number: verse.page_number,
                juz_number: verse.juz_number,
            };
        });

        // Limit results
        const limitedResults = results.slice(0, limit);

        return {
            results: limitedResults,
            totalResults: results.length,
        };
    } catch (error) {
        console.error('Error searching in juz:', error);
        return { results: [], totalResults: 0 };
    }
}

/**
 * Reset the local search cache
 */
export function resetLocalSearchCache(): void {
    fuseInstance = null;
    cachedVerses = [];
}

/**
 * Check if local search is ready
 */
export function isLocalSearchReady(): boolean {
    return fuseInstance !== null && cachedVerses.length > 0;
}
