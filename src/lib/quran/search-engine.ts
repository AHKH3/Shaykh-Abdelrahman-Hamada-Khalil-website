import type { UnifiedSearchResult } from './api';
import { searchQuran as searchQuranCom } from './api';
import { searchAlQuranCloud } from './api-alquran';
import { searchVersesLocally, isLocalSearchReady } from './local-search';
import { isIndexAvailable, fetchAndCacheVerses } from './verse-index';

export interface SearchEngineOptions {
    query: string;
    language?: string;
    page?: number;
    size?: number;
    chapterId?: number;
    juzNumber?: number;
    onProgress?: (message: string, progress?: number, total?: number) => void;
}

export interface SearchEngineResult {
    results: UnifiedSearchResult[];
    totalResults: number;
    currentPage: number;
    totalPages: number;
    source: 'quran-com' | 'alquran-cloud' | 'local';
}

// Cache for search results
const searchCache = new Map<string, SearchEngineResult>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key for search options
 */
function getCacheKey(options: SearchEngineOptions): string {
    return JSON.stringify({
        q: options.query,
        lang: options.language,
        page: options.page,
        size: options.size,
        chapter: options.chapterId,
        juz: options.juzNumber,
    });
}

/**
 * Get cached result if available and not expired
 */
function getCachedResult(options: SearchEngineOptions): SearchEngineResult | null {
    const key = getCacheKey(options);
    const cached = searchCache.get(key);

    if (cached) {
        const age = Date.now() - (cached as any).timestamp;
        if (age < CACHE_TTL) {
            return cached;
        } else {
            searchCache.delete(key);
        }
    }

    return null;
}

/**
 * Cache search result
 */
function cacheResult(options: SearchEngineOptions, result: SearchEngineResult): void {
    const key = getCacheKey(options);
    searchCache.set(key, { ...result, timestamp: Date.now() } as any);
}

/**
 * Clear search cache
 */
export function clearSearchCache(): void {
    searchCache.clear();
}

/**
 * Try searching with Quran.com API
 */
async function tryQuranComAPI(options: SearchEngineOptions): Promise<SearchEngineResult> {
    const { query, language = 'ar', page = 1, size = 50, chapterId, juzNumber } = options;

    try {
        options.onProgress?.('Searching with Quran.com API...');

        const data = await searchQuranCom(query, language, page);

        // Filter by chapter or juz if specified
        let filteredResults = data.search.results;

        if (chapterId) {
            filteredResults = filteredResults.filter((result) => {
                const [chapter] = result.verse_key.split(':').map(Number);
                return chapter === chapterId;
            });
        }

        if (juzNumber) {
            // Note: Quran.com API doesn't provide juz in search results
            // We'll need to fetch verse details, but for now skip juz filtering
            console.warn('Juz filtering not available in Quran.com search results');
        }

        // Convert to UnifiedSearchResult format
        const results: UnifiedSearchResult[] = filteredResults.map((result) => ({
            type: 'verse' as const,
            verseKey: result.verse_key,
            verseId: result.verse_id,
            text: result.text,
            highlighted: result.highlighted,
            matchScore: 70, // High priority for Quran.com results
        }));

        return {
            results,
            totalResults: chapterId ? filteredResults.length : data.search.total_results,
            currentPage: data.search.current_page,
            totalPages: data.search.total_pages,
            source: 'quran-com',
        };
    } catch (error) {
        console.warn('Quran.com API search failed:', error);
        throw error;
    }
}

/**
 * Try searching with Al Quran Cloud API
 */
async function tryAlQuranCloudAPI(options: SearchEngineOptions): Promise<SearchEngineResult> {
    const { query, language = 'ar', page = 1, size = 50, chapterId, juzNumber } = options;

    try {
        options.onProgress?.('Searching with Al Quran Cloud API...');

        let result;

        if (chapterId) {
            const data = await searchAlQuranCloudInChapter(chapterId, query, language, size);
            result = {
                results: data.results,
                totalResults: data.totalResults,
                currentPage: 1,
                totalPages: 1,
                source: 'alquran-cloud' as const,
            };
        } else {
            const data = await searchAlQuranCloud({ query, language, size, page });
            result = {
                results: data.results,
                totalResults: data.totalResults,
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                source: 'alquran-cloud' as const,
            };
        }

        // Filter by juz if specified
        if (juzNumber && result.results.length > 0) {
            // We would need to fetch verse details to filter by juz
            // For now, skip juz filtering
            console.warn('Juz filtering not fully implemented for Al Quran Cloud');
        }

        return result;
    } catch (error) {
        console.warn('Al Quran Cloud API search failed:', error);
        throw error;
    }
}

/**
 * Search in a specific chapter using Al Quran Cloud API
 */
async function searchAlQuranCloudInChapter(
    chapterId: number,
    query: string,
    language: string,
    size: number
): Promise<{ results: UnifiedSearchResult[]; totalResults: number }> {
    const { searchAlQuranCloudInChapter } = await import('./api-alquran');
    return searchAlQuranCloudInChapter({ chapterId, query, language, size });
}

/**
 * Try searching locally
 */
async function tryLocalSearch(options: SearchEngineOptions): Promise<SearchEngineResult> {
    const { query, chapterId, juzNumber, size = 50 } = options;

    try {
        options.onProgress?.('Searching locally...');

        // Check if local search is ready
        if (!await isIndexAvailable()) {
            options.onProgress?.('Loading verse index...', 0, 100);

            // Fetch and cache verses
            await fetchAndCacheVerses((progress, total) => {
                const percent = Math.round((progress / total) * 100);
                options.onProgress?.('Loading verse index...', percent, 100);
            });

            options.onProgress?.('Verse index loaded!', 100, 100);
        }

        // Perform local search
        const data = await searchVersesLocally({
            query,
            chapterId,
            juzNumber,
            limit: size,
        });

        // Convert to UnifiedSearchResult format
        const results: UnifiedSearchResult[] = data.results.map((result) => ({
            type: 'verse' as const,
            verseKey: result.verse_key,
            text: result.text,
            highlighted: result.highlighted,
            matchScore: 50, // Lower priority than API results
        }));

        return {
            results,
            totalResults: data.totalResults,
            currentPage: 1,
            totalPages: 1,
            source: 'local',
        };
    } catch (error) {
        console.warn('Local search failed:', error);
        throw error;
    }
}

/**
 * Main search function with fallback mechanism
 */
export async function searchWithFallback(options: SearchEngineOptions): Promise<SearchEngineResult> {
    const { query } = options;

    if (!query || query.trim().length < 2) {
        return {
            results: [],
            totalResults: 0,
            currentPage: 1,
            totalPages: 1,
            source: 'local',
        };
    }

    // Check cache first
    const cached = getCachedResult(options);
    if (cached) {
        options.onProgress?.('Using cached results...');
        return cached;
    }

    // Try Quran.com API first
    try {
        const result = await tryQuranComAPI(options);
        if (result.results.length > 0) {
            cacheResult(options, result);
            return result;
        }
    } catch (error) {
        console.warn('Quran.com API failed, trying fallback...');
    }

    // Try Al Quran Cloud API as fallback
    try {
        const result = await tryAlQuranCloudAPI(options);
        if (result.results.length > 0) {
            cacheResult(options, result);
            return result;
        }
    } catch (error) {
        console.warn('Al Quran Cloud API failed, trying local search...');
    }

    // Try local search as last resort
    try {
        const result = await tryLocalSearch(options);
        cacheResult(options, result);
        return result;
    } catch (error) {
        console.error('All search methods failed:', error);
        return {
            results: [],
            totalResults: 0,
            currentPage: 1,
            totalPages: 1,
            source: 'local',
        };
    }
}

/**
 * Search with priority order (surahs first, then verses)
 */
export async function searchWithPriority(
    options: SearchEngineOptions,
    surahResults: UnifiedSearchResult[]
): Promise<SearchEngineResult> {
    const verseResult = await searchWithFallback(options);

    // Merge surah and verse results
    const allResults = [...surahResults, ...verseResult.results];

    // Sort by match score
    allResults.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return {
        results: allResults,
        totalResults: allResults.length,
        currentPage: verseResult.currentPage,
        totalPages: verseResult.totalPages,
        source: verseResult.source,
    };
}

/**
 * Get search source label
 */
export function getSearchSourceLabel(source: 'quran-com' | 'alquran-cloud' | 'local', locale: string): string {
    switch (source) {
        case 'quran-com':
            return locale === 'ar' ? 'من Quran.com' : 'From Quran.com';
        case 'alquran-cloud':
            return locale === 'ar' ? 'من Al Quran Cloud' : 'From Al Quran Cloud';
        case 'local':
            return locale === 'ar' ? 'بحث محلي' : 'Local Search';
        default:
            return '';
    }
}
