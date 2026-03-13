const BASE_URL = "https://api.quran.com/api/v4";

// Import the local search engine
import { searchWithFallback, type SearchEngineOptions } from './search-engine';

export interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: number | null;
  page_number: number;
  juz_number: number;
  text_uthmani: string;
  text_imlaei?: string;
  chapter_id: number;
  words?: Word[];
}

export interface Word {
  id: number;
  position: number;
  text_uthmani: string;
  text_imlaei?: string;
  translation?: {
    text: string;
    language_name: string;
  };
  transliteration?: {
    text: string;
    language_name: string;
  };
  char_type_name: string;
  page_number: number;
  line_number: number;
}

export interface Juz {
  id: number;
  juz_number: number;
  verse_mapping: Record<string, string>;
  first_verse_id: number;
  last_verse_id: number;
  verses_count: number;
}

export interface AudioFile {
  url: string;
  duration: number;
  format: string;
  verse_key: string;
}

export interface SearchResult {
  search: {
    query: string;
    total_results: number;
    current_page: number;
    total_pages: number;
    results: Array<{
      verse_key: string;
      verse_id: number;
      text: string;
      highlighted: string;
      words: Array<{
        char_type: string;
        text: string;
      }>;
    }>;
  };
}

// Advanced search options
export interface AdvancedSearchOptions {
  query: string;
  language?: string;
  page?: number;
  size?: number;
  chapterId?: number;
  juzNumber?: number;
}

// Unified search result (combines verse and surah results)
export type UnifiedSearchResult =
  | {
      type: "verse";
      verseKey: string;
      verseId?: number;
      text?: string;
      highlighted?: string;
      surahId?: number;
      surahName?: string;
      surahNameArabic?: string;
      pageNumber: number;
      matchScore?: number;
    }
  | {
      type: "surah";
      surahId: number;
      surahName: string;
      surahNameArabic?: string;
      pageNumber: number;
      matchScore?: number;
    };

export interface Tafsir {
  id: number;
  resource_id: number;
  text: string;
  verse_key: string;
  verse_id: number;
  language_name: string;
  resource_name: string;
}

export async function getChapters(language: string = "ar"): Promise<Chapter[]> {
  const res = await fetch(`${BASE_URL}/chapters?language=${language}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error("Failed to fetch chapters");
  const data = await res.json();
  return data.chapters;
}

export async function getChapter(id: number, language: string = "ar"): Promise<Chapter> {
  const res = await fetch(`${BASE_URL}/chapters/${id}?language=${language}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error("Failed to fetch chapter");
  const data = await res.json();
  return data.chapter;
}

export async function getVersesByPage(
  pageNumber: number,
  options: {
    words?: boolean;
    translations?: string;
    fields?: string;
    word_fields?: string;
  } = {}
): Promise<{ verses: Verse[]; pagination: { total_records: number } }> {
  const params = new URLSearchParams({
    page: pageNumber.toString(),
    per_page: "50",
    words: (options.words ?? true).toString(),
    word_fields: options.word_fields || "text_uthmani,text_imlaei,line_number",
    fields: options.fields || "text_uthmani,chapter_id,verse_number,page_number,juz_number,hizb_number",
  });

  if (options.translations) {
    params.set("translations", options.translations);
  }

  const res = await fetch(`${BASE_URL}/verses/by_page/${pageNumber}?${params}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error("Failed to fetch verses");
  return res.json();
}

export async function getVersesByChapter(
  chapterId: number,
  page: number = 1
): Promise<{ verses: Verse[]; pagination: { total_pages: number; total_records: number } }> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: "50",
    words: "true",
    word_fields: "text_uthmani,line_number",
    fields: "text_uthmani,chapter_id,verse_number,page_number,juz_number",
  });

  const res = await fetch(`${BASE_URL}/verses/by_chapter/${chapterId}?${params}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error("Failed to fetch verses");
  return res.json();
}

export async function searchQuran(
  query: string,
  language: string = "ar",
  page: number = 1
): Promise<SearchResult> {
  // Use the hybrid search engine with fallback
  const searchOptions: SearchEngineOptions = {
    query,
    language,
    page,
    size: 20,
  };

  const result = await searchWithFallback(searchOptions);
  const verseResults = result.results.filter(
    (entry): entry is Extract<UnifiedSearchResult, { type: "verse" }> => entry.type === "verse"
  );

  // Convert back to SearchResult format for backward compatibility
  return {
    search: {
      query,
      total_results: result.totalResults,
      current_page: result.currentPage,
      total_pages: result.totalPages,
      results: verseResults.map((entry) => ({
        verse_key: entry.verseKey,
        verse_id: entry.verseId ?? 0,
        text: entry.text ?? "",
        highlighted: entry.highlighted ?? entry.text ?? "",
        words: [],
      }))
    }
  };
}



// Advanced search with filters (now using hybrid search engine)
export async function searchQuranAdvanced(
  options: AdvancedSearchOptions
): Promise<{
  results: UnifiedSearchResult[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
}> {
  const {
    query,
    language = "ar",
    page = 1,
    size = 50,
    chapterId,
    juzNumber,
  } = options;

  // Use the hybrid search engine with fallback
  const searchOptions: SearchEngineOptions = {
    query,
    language,
    page,
    size,
    chapterId,
    juzNumber,
  };

  const result = await searchWithFallback(searchOptions);

  return {
    results: result.results,
    totalResults: result.totalResults,
    currentPage: result.currentPage,
    totalPages: result.totalPages,
  };
}

// Search in surah names locally
export function searchSurahs(
  query: string,
  chapters: Chapter[],
  locale: string
): UnifiedSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return [];

  return chapters
    .filter((chapter) => {
      const arabicName = chapter.name_arabic?.toLowerCase() || "";
      const englishName = chapter.name_simple?.toLowerCase() || "";
      const translatedName = chapter.translated_name?.name?.toLowerCase() || "";
      const chapterNum = chapter.id.toString();

      return (
        arabicName.includes(normalizedQuery) ||
        englishName.includes(normalizedQuery) ||
        translatedName.includes(normalizedQuery) ||
        chapterNum === normalizedQuery
      );
    })
    .map((chapter) => ({
      type: 'surah' as const,
      surahId: chapter.id,
      surahName: locale === 'ar' ? chapter.name_arabic : chapter.name_simple,
      surahNameArabic: chapter.name_arabic,
      pageNumber: SURAH_PAGES[chapter.id],
      matchScore: 100, // Highest priority for surah matches
    }));
}

// Get verses by range (e.g., Al-Baqarah 1-10)
export async function getVersesByRange(
  chapterId: number,
  fromVerse: number,
  toVerse: number
): Promise<{ verses: Verse[]; chapterInfo?: Chapter }> {
  try {
    // Fetch all verses for the chapter
    let allVerses: Verse[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await getVersesByChapter(chapterId, currentPage);
      allVerses = allVerses.concat(response.verses);

      // Check if we've loaded all verses we need
      const lastVerse = response.verses[response.verses.length - 1];
      if (!lastVerse || lastVerse.verse_number >= toVerse || currentPage >= response.pagination.total_pages) {
        hasMore = false;
      }
      currentPage++;
    }

    // Filter to the requested range
    const filteredVerses = allVerses.filter(
      (verse) => verse.verse_number >= fromVerse && verse.verse_number <= toVerse
    );

    return { verses: filteredVerses };
  } catch (error) {
    console.error("Failed to fetch verse range:", error);
    throw error;
  }
}

// Validate verse range
export function validateVerseRange(
  chapterId: number,
  fromVerse: number,
  toVerse: number,
  chapters: Chapter[]
): { valid: boolean; error?: string; errorEn?: string } {
  const chapter = chapters.find((c) => c.id === chapterId);

  if (!chapter) {
    return {
      valid: false,
      error: "السورة غير موجودة",
      errorEn: "Chapter not found"
    };
  }

  if (fromVerse < 1 || toVerse > chapter.verses_count) {
    return {
      valid: false,
      error: `السورة تحتوي على ${chapter.verses_count} آية فقط`,
      errorEn: `Chapter has only ${chapter.verses_count} verses`
    };
  }

  if (fromVerse > toVerse) {
    return {
      valid: false,
      error: "رقم الآية الأولى يجب أن يكون أقل من الآية الأخيرة",
      errorEn: "From verse must be less than to verse"
    };
  }

  return { valid: true };
}

export async function getJuzs(): Promise<Juz[]> {
  const res = await fetch(`${BASE_URL}/juzs`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error("Failed to fetch juzs");
  const data = await res.json();
  return data.juzs;
}

export interface Reciter {
  id: number;
  name: string;
  nameEn: string;
  slug: string;
  style: "مرتل" | "مجود" | "معلم";
  styleEn: "Murattal" | "Mujawwad" | "Muallim";
}

export function getAudioUrl(
  reciterId: number,
  chapterId: number,
  verseNumber: number
): string {
  const paddedChapter = chapterId.toString().padStart(3, "0");
  const paddedVerse = verseNumber.toString().padStart(3, "0");
  const reciter = RECITERS.find((r) => r.id === reciterId) || RECITERS[0];
  return `https://everyayah.com/data/${reciter.slug}/${paddedChapter}${paddedVerse}.mp3`;
}

export function getPageAudioUrl(reciterId: number, pageNumber: number): string {
  return `https://cdn.qurancdn.com/audio/page/${reciterId}/${pageNumber}.mp3`;
}

// Tafsir resources
export interface TafsirResource {
  id: number;
  name: string;
  language: string;
  nameEn: string;
}

export const DEFAULT_ARABIC_TAFSIR_ID = 16;
export const DEFAULT_ENGLISH_TAFSIR_ID = 168;

export const TAFSIR_RESOURCES: Record<number, TafsirResource> = {
  // Arabic tafsirs
  169: { id: 169, name: "ابن كثير (مختصر)", language: "ar", nameEn: "Ibn Kathir (Abridged)" },
  14: { id: 14, name: "ابن كثير (كامل)", language: "ar", nameEn: "Ibn Kathir (Complete)" },
  15: { id: 15, name: "الطبري", language: "ar", nameEn: "Al-Tabari" },
  16: { id: 16, name: "التفسير الميسر", language: "ar", nameEn: "Tafsir al-Muyassar" },
  90: { id: 90, name: "القرطبي", language: "ar", nameEn: "Al-Qurtubi" },
  91: { id: 91, name: "السعدي", language: "ar", nameEn: "Al-Sa'di" },
  93: { id: 93, name: "الوسيط (طنطاوي)", language: "ar", nameEn: "Al-Wasit" },
  94: { id: 94, name: "البغوي", language: "ar", nameEn: "Al-Baghawi" },
  // English tafsirs
  168: { id: 168, name: "Ma'arif al-Qur'an", language: "en", nameEn: "Ma'arif al-Qur'an" },
  817: { id: 817, name: "Tazkirul Quran", language: "en", nameEn: "Tazkirul Quran" },
};

export async function getTafsir(
  verseKey: string,
  tafsirId: number = DEFAULT_ARABIC_TAFSIR_ID, // Tafsir al-Muyassar
  options: { signal?: AbortSignal } = {}
): Promise<Tafsir> {
  const res = await fetch(
    `${BASE_URL}/tafsirs/${tafsirId}/by_ayah/${verseKey}`,
    { next: { revalidate: 86400 }, signal: options.signal }
  );
  if (!res.ok) throw new Error("Failed to fetch tafsir");
  const data = await res.json();
  return data.tafsir;
}

// Reciters — everyayah.com slugs
export const RECITERS: Reciter[] = [
  { id: 1,  name: "مشاري العفاسي",           nameEn: "Mishary Alafasy",        slug: "Alafasy_128kbps",                       style: "مرتل",  styleEn: "Murattal" },
  { id: 2,  name: "عبد الباسط - مرتل",       nameEn: "Abdul Basit (Murattal)", slug: "AbdulBaset_Murattal_128kbps",           style: "مرتل",  styleEn: "Murattal" },
  { id: 3,  name: "عبد الباسط - مجود",       nameEn: "Abdul Basit (Mujawwad)", slug: "Abdul_Basit_Mujawwad_128kbps",          style: "مجود",  styleEn: "Mujawwad" },
  { id: 4,  name: "المنشاوي - مرتل",         nameEn: "Al-Minshawi (Murattal)", slug: "Minshawi_Murattal_128kbps",             style: "مرتل",  styleEn: "Murattal" },
  { id: 5,  name: "المنشاوي - مجود",         nameEn: "Al-Minshawi (Mujawwad)", slug: "Minshawi_Mujawwad_128kbps",             style: "مجود",  styleEn: "Mujawwad" },
  { id: 6,  name: "الحصري - مرتل",           nameEn: "Al-Husary (Murattal)",   slug: "Husary_128kbps",                        style: "مرتل",  styleEn: "Murattal" },
  { id: 7,  name: "الحصري - مجود",           nameEn: "Al-Husary (Mujawwad)",   slug: "Husary_Mujawwad_128kbps",               style: "مجود",  styleEn: "Mujawwad" },
  { id: 8,  name: "الحصري - معلم",           nameEn: "Al-Husary (Muallim)",    slug: "Husary_Muallim_128kbps",                style: "معلم",  styleEn: "Muallim"  },
  { id: 9,  name: "محمود البنا",             nameEn: "Mahmoud Al-Banna",       slug: "mahmoud_ali_al_banna_128kbps",          style: "مرتل",  styleEn: "Murattal" },
  { id: 10, name: "فارس عباد",              nameEn: "Fares Abbad",            slug: "Fares_Abbad_128kbps",                   style: "مرتل",  styleEn: "Murattal" },
  { id: 11, name: "عبد الرحمن السديس",       nameEn: "Abdul Rahman Al-Sudais", slug: "Abdurrahmaan_As-Sudais_192kbps",        style: "مرتل",  styleEn: "Murattal" },
];

// Surah page mapping (first page of each surah)
export const SURAH_PAGES: Record<number, number> = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177,
  9: 187, 10: 208, 11: 221, 12: 235, 13: 249, 14: 255, 15: 262,
  16: 267, 17: 282, 18: 293, 19: 305, 20: 312, 21: 322, 22: 332,
  23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 385, 29: 396,
  30: 404, 31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440,
  37: 446, 38: 453, 39: 458, 40: 467, 41: 477, 42: 483, 43: 489,
  44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515, 50: 518,
  51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537,
  58: 542, 59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556,
  65: 558, 66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570,
  72: 572, 73: 574, 74: 575, 75: 577, 76: 578, 77: 580, 78: 582,
  79: 583, 80: 585, 81: 586, 82: 587, 83: 587, 84: 589, 85: 590,
  86: 591, 87: 591, 88: 592, 89: 593, 90: 594, 91: 595, 92: 595,
  93: 596, 94: 596, 95: 597, 96: 597, 97: 598, 98: 598, 99: 599,
  100: 599, 101: 600, 102: 600, 103: 601, 104: 601, 105: 601,
  106: 602, 107: 602, 108: 602, 109: 603, 110: 603, 111: 603,
  112: 604, 113: 604, 114: 604,
};

// Juz page mapping (first page of each juz)
export const JUZ_START_PAGES: Record<number, number> = {
  1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 121, 8: 142,
  9: 162, 10: 182, 11: 201, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302,
  17: 322, 18: 342, 19: 362, 20: 382, 21: 402, 22: 422, 23: 442, 24: 462,
  25: 482, 26: 502, 27: 522, 28: 542, 29: 562, 30: 582,
};

export const TOTAL_PAGES = 604;
