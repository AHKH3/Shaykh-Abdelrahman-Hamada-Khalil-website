/**
 * Search engine — local-first, no external API dependency.
 * All searching is done client-side on the embedded Quran data.
 */

import type { UnifiedSearchResult } from './api';
import { searchVersesLocally } from './local-search';

export interface SearchEngineOptions {
    query: string;
    language?: string;
    page?: number;
    size?: number;
    chapterId?: number;
    juzNumber?: number;
}

export interface SearchEngineResult {
    results: UnifiedSearchResult[];
    totalResults: number;
    currentPage: number;
    totalPages: number;
    source: 'local';
}

// In-memory search result cache
const searchCache = new Map<string, { result: SearchEngineResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key for search options.
 */
function getCacheKey(options: SearchEngineOptions): string {
    return JSON.stringify({
        q: options.query,
        page: options.page,
        size: options.size,
        chapter: options.chapterId,
        juz: options.juzNumber,
    });
}

/**
 * Get cached result if available and not expired.
 */
function getCachedResult(options: SearchEngineOptions): SearchEngineResult | null {
    const key = getCacheKey(options);
    const cached = searchCache.get(key);

    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.result;
    }

    if (cached) searchCache.delete(key);
    return null;
}

/**
 * Cache a search result.
 */
function cacheResult(options: SearchEngineOptions, result: SearchEngineResult): void {
    const key = getCacheKey(options);
    searchCache.set(key, { result, timestamp: Date.now() });
}

/**
 * Clear search cache.
 */
export function clearSearchCache(): void {
    searchCache.clear();
}

/**
 * Main search function — fully local, instant results.
 */
export async function searchWithFallback(options: SearchEngineOptions): Promise<SearchEngineResult> {
    const { query, page = 1, size = 50 } = options;

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
    if (cached) return cached;

    try {
        // Perform local search
        const data = await searchVersesLocally({
            query,
            chapterId: options.chapterId,
            juzNumber: options.juzNumber,
            limit: size * 10, // Get more results for pagination
        });

        // Convert to UnifiedSearchResult format
        const allResults: UnifiedSearchResult[] = data.results.map((result) => ({
            type: 'verse' as const,
            verseKey: result.verse_key,
            text: result.text,
            highlighted: result.highlighted,
            surahId: result.chapter_id,
            pageNumber: result.page_number,
            matchScore: result.score,
        }));

        // Apply pagination
        const totalResults = allResults.length;
        const totalPages = Math.max(1, Math.ceil(totalResults / size));
        const startIndex = (page - 1) * size;
        const paginatedResults = allResults.slice(startIndex, startIndex + size);

        const result: SearchEngineResult = {
            results: paginatedResults,
            totalResults,
            currentPage: page,
            totalPages,
            source: 'local',
        };

        cacheResult(options, result);
        return result;
    } catch (error) {
        console.error('Search failed:', error);
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
 * Search with priority order (surahs first, then verses).
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
        source: 'local',
    };
}

/**
 * Get search source label.
 */
export function getSearchSourceLabel(source: string, locale: string): string {
    return locale === 'ar' ? 'بحث محلي' : 'Local Search';
}
