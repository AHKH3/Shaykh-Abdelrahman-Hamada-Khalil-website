import type { UnifiedSearchResult } from './api';

const BASE_URL = 'https://alquran.cloud/api/v1';

/**
 * Al Quran Cloud API response structure
 */
interface AlQuranSearchResponse {
  code: number;
  status: string;
  data: AlQuranSearchResult[];
}

interface AlQuranSearchResult {
  number: number;
  text: string;
  edition: {
    identifier: string;
    language: string;
    name: string;
    englishName: string;
    format: string;
    type: string;
    direction: string;
  };
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
  };
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
}

/**
 * Search using Al Quran Cloud API
 */
export async function searchAlQuranCloud(options: {
  query: string;
  language?: string;
  size?: number;
  page?: number;
}): Promise<{
  results: UnifiedSearchResult[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
}> {
  const { query, language = 'ar', size = 50, page = 1 } = options;

  if (!query || query.trim().length < 2) {
    return {
      results: [],
      totalResults: 0,
      currentPage: 1,
      totalPages: 1,
    };
  }

  try {
    // Al Quran Cloud search endpoint
    const url = new URL(`${BASE_URL}/search/${encodeURIComponent(query.trim())}/all`);
    url.searchParams.append('language', language);
    
    const res = await fetch(url.toString());
    
    if (!res.ok) {
      throw new Error(`Al Quran Cloud API failed: ${res.status}`);
    }

    const data: AlQuranSearchResponse = await res.json();

    if (!data.data || data.data.length === 0) {
      return {
        results: [],
        totalResults: 0,
        currentPage: 1,
        totalPages: 1,
      };
    }

    // Convert to UnifiedSearchResult format
    const results: UnifiedSearchResult[] = data.data.map((item) => {
      const verseKey = `${item.surah.number}:${item.numberInSurah}`;
      
      return {
        type: 'verse',
        verseKey,
        verseId: item.number,
        text: item.text,
        highlighted: highlightText(item.text, query),
        matchScore: 60, // Medium priority
      };
    });

    // Calculate pagination
    const totalResults = results.length;
    const totalPages = Math.ceil(totalResults / size);
    
    // Apply pagination
    const startIndex = (page - 1) * size;
    const paginatedResults = results.slice(startIndex, startIndex + size);

    return {
      results: paginatedResults,
      totalResults,
      currentPage: page,
      totalPages,
    };
  } catch (error) {
    console.error('Error searching with Al Quran Cloud:', error);
    throw error;
  }
}

/**
 * Search in a specific chapter using Al Quran Cloud API
 */
export async function searchAlQuranCloudInChapter(options: {
  chapterId: number;
  query: string;
  language?: string;
  size?: number;
}): Promise<{
  results: UnifiedSearchResult[];
  totalResults: number;
}> {
  const { chapterId, query, language = 'ar', size = 50 } = options;

  if (!query || query.trim().length < 2) {
    return {
      results: [],
      totalResults: 0,
    };
  }

  try {
    // First, get all verses in the chapter
    const url = new URL(`${BASE_URL}/surah/${chapterId}`);
    url.searchParams.append('language', language);
    
    const res = await fetch(url.toString());
    
    if (!res.ok) {
      throw new Error(`Al Quran Cloud API failed: ${res.status}`);
    }

    const data: any = await res.json();
    const verses = data.data?.ayahs || [];

    // Filter verses that contain the query
    const normalizedQuery = query.trim().toLowerCase();
    const matchingVerses = verses.filter((verse: any) => 
      verse.text.toLowerCase().includes(normalizedQuery)
    );

    // Convert to UnifiedSearchResult format
    const results: UnifiedSearchResult[] = matchingVerses.map((item: any) => {
      const verseKey = `${chapterId}:${item.numberInSurah}`;
      
      return {
        type: 'verse',
        verseKey,
        verseId: item.number,
        text: item.text,
        highlighted: highlightText(item.text, query),
        matchScore: 60,
      };
    });

    // Limit results
    const limitedResults = results.slice(0, size);

    return {
      results: limitedResults,
      totalResults: results.length,
    };
  } catch (error) {
    console.error('Error searching in chapter with Al Quran Cloud:', error);
    throw error;
  }
}

/**
 * Highlight matching text in the verse
 */
function highlightText(text: string, query: string): string {
  if (!query || query.trim().length < 2) {
    return text;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const regex = new RegExp(`(${escapeRegex(normalizedQuery)})`, 'gi');
  
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get verse by key using Al Quran Cloud API
 */
export async function getVerseAlQuranCloud(verseKey: string, language: string = 'ar'): Promise<{
  verse_key: string;
  text: string;
  chapter_id: number;
  verse_number: number;
  page_number: number;
  juz_number: number;
} | null> {
  try {
    const [chapterId, verseNumber] = verseKey.split(':').map(Number);
    
    const url = new URL(`${BASE_URL}/ayah/${verseKey}`);
    url.searchParams.append('language', language);
    
    const res = await fetch(url.toString());
    
    if (!res.ok) {
      return null;
    }

    const data: any = await res.json();
    const verse = data.data;

    if (!verse) {
      return null;
    }

    return {
      verse_key: verseKey,
      text: verse.text,
      chapter_id: chapterId,
      verse_number: verseNumber,
      page_number: verse.page,
      juz_number: verse.juz,
    };
  } catch (error) {
    console.error('Error getting verse from Al Quran Cloud:', error);
    return null;
  }
}

/**
 * Check if Al Quran Cloud API is available
 */
export async function checkAlQuranCloudAvailability(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/surah/1`, {
      method: 'HEAD',
    });
    return res.ok;
  } catch (error) {
    return false;
  }
}
