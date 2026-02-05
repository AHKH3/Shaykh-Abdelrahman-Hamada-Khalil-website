const BASE_URL = "https://api.quran.com/api/v4";

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
  const params = new URLSearchParams({
    q: query,
    size: "20",
    page: page.toString(),
    language,
  });

  const res = await fetch(`${BASE_URL}/search?${params}`);
  if (!res.ok) throw new Error("Failed to search");
  return res.json();
}

export async function getJuzs(): Promise<Juz[]> {
  const res = await fetch(`${BASE_URL}/juzs`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error("Failed to fetch juzs");
  const data = await res.json();
  return data.juzs;
}

export function getAudioUrl(
  reciterId: number,
  chapterId: number,
  verseNumber: number
): string {
  const paddedChapter = chapterId.toString().padStart(3, "0");
  const paddedVerse = verseNumber.toString().padStart(3, "0");
  return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${paddedChapter}${paddedVerse}.mp3`;
}

export function getPageAudioUrl(reciterId: number, pageNumber: number): string {
  return `https://cdn.qurancdn.com/audio/page/${reciterId}/${pageNumber}.mp3`;
}

export async function getTafsir(
  verseKey: string,
  tafsirId: number = 169 // Ibn Kathir Arabic
): Promise<Tafsir> {
  const res = await fetch(
    `${BASE_URL}/tafsirs/${tafsirId}/by_ayah/${verseKey}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error("Failed to fetch tafsir");
  const data = await res.json();
  return data.tafsir;
}

// Reciters
export const RECITERS = [
  { id: 7, name: "مشاري العفاسي", nameEn: "Mishary Alafasy" },
  { id: 1, name: "عبد الباسط عبد الصمد", nameEn: "Abdul Basit" },
  { id: 5, name: "ماهر المعيقلي", nameEn: "Maher Al-Muaiqly" },
  { id: 4, name: "أحمد العجمي", nameEn: "Ahmed Al-Ajmi" },
  { id: 6, name: "سعود الشريم", nameEn: "Saud Al-Shuraim" },
  { id: 10, name: "ياسر الدوسري", nameEn: "Yasser Al-Dosari" },
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

export const TOTAL_PAGES = 604;
