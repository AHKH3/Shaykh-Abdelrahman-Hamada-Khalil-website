import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'QuranSearchDB';
const DB_VERSION = 1;
const STORE_NAME = 'verses';
const META_STORE_NAME = 'meta';

export interface VerseIndex {
    id: string; // verse_key
    text_uthmani: string;
    text_imlaei: string;
    chapter_id: number;
    verse_number: number;
    page_number: number;
    juz_number: number;
}

export interface IndexedVerses {
    verses: VerseIndex[];
    lastUpdated: number;
    version: string;
}

interface QuranSearchDB extends DBSchema {
    verses: {
        key: string;
        value: VerseIndex;
        indexes: {
            'by-chapter': number;
            'by-juz': number;
            'by-page': number;
        };
    };
    meta: {
        key: string;
        value: {
            lastUpdated: number;
            version: string;
            totalVerses: number;
        };
    };
}

const INDEX_VERSION = '1.0.0';

let dbPromise: Promise<IDBPDatabase<QuranSearchDB>> | null = null;

function getDB(): Promise<IDBPDatabase<QuranSearchDB>> {
    if (!dbPromise) {
        dbPromise = openDB<QuranSearchDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('by-chapter', 'chapter_id');
                    store.createIndex('by-juz', 'juz_number');
                    store.createIndex('by-page', 'page_number');
                }
                if (!db.objectStoreNames.contains(META_STORE_NAME)) {
                    db.createObjectStore(META_STORE_NAME);
                }
            },
        });
    }
    return dbPromise;
}

export async function isIndexAvailable(): Promise<boolean> {
    try {
        const db = await getDB();
        const meta = await db.get(META_STORE_NAME, 'index-meta');
        return !!meta && meta.version === INDEX_VERSION;
    } catch (error) {
        console.error('Error checking index availability:', error);
        return false;
    }
}

export async function loadVerseIndex(): Promise<VerseIndex[]> {
    try {
        const db = await getDB();
        const verses = await db.getAll(STORE_NAME);
        return verses;
    } catch (error) {
        console.error('Error loading verse index:', error);
        throw error;
    }
}

export async function fetchAndCacheVerses(onProgress?: (progress: number, total: number) => void): Promise<VerseIndex[]> {
    const BASE_URL = 'https://api.quran.com/api/v4';
    const allVerses: VerseIndex[] = [];

    try {
        // Fetch all chapters first
        const chaptersRes = await fetch(`${BASE_URL}/chapters?language=ar`);
        if (!chaptersRes.ok) throw new Error('Failed to fetch chapters');
        const chaptersData = await chaptersRes.json();
        const chapters = chaptersData.chapters;

        let totalVerses = 0;
        let loadedVerses = 0;

        // Calculate total verses for progress tracking
        for (const chapter of chapters) {
            totalVerses += chapter.verses_count;
        }

        // Fetch verses for each chapter
        for (const chapter of chapters) {
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const params = new URLSearchParams({
                    page: page.toString(),
                    per_page: '50',
                    words: 'false',
                    fields: 'text_uthmani,text_imlaei,chapter_id,verse_number,page_number,juz_number',
                });

                const res = await fetch(`${BASE_URL}/verses/by_chapter/${chapter.id}?${params}`);
                if (!res.ok) throw new Error(`Failed to fetch verses for chapter ${chapter.id}`);

                const data = await res.json();
                const verses: any[] = data.verses || [];

                for (const verse of verses) {
                    const verseIndex: VerseIndex = {
                        id: verse.verse_key,
                        text_uthmani: verse.text_uthmani,
                        text_imlaei: verse.text_imlaei || verse.text_uthmani,
                        chapter_id: verse.chapter_id,
                        verse_number: verse.verse_number,
                        page_number: verse.page_number,
                        juz_number: verse.juz_number,
                    };
                    allVerses.push(verseIndex);
                    loadedVerses++;

                    if (onProgress && loadedVerses % 50 === 0) {
                        onProgress(loadedVerses, totalVerses);
                    }
                }

                // Check if we've loaded all verses for this chapter
                const lastVerse = verses[verses.length - 1];
                if (!lastVerse || lastVerse.verse_number >= chapter.verses_count || page >= data.pagination.total_pages) {
                    hasMore = false;
                }
                page++;
            }
        }

        // Store in IndexedDB
        await storeVerseIndex(allVerses);

        return allVerses;
    } catch (error) {
        console.error('Error fetching and caching verses:', error);
        throw error;
    }
}

export async function storeVerseIndex(verses: VerseIndex[]): Promise<void> {
    try {
        const db = await getDB();

        // Clear existing data
        await db.clear(STORE_NAME);

        // Store all verses
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        for (const verse of verses) {
            await store.put(verse);
        }

        await tx.done;

        // Store metadata
        await db.put(META_STORE_NAME, {
            lastUpdated: Date.now(),
            version: INDEX_VERSION,
            totalVerses: verses.length,
        }, 'index-meta');

        console.log(`Stored ${verses.length} verses in IndexedDB`);
    } catch (error) {
        console.error('Error storing verse index:', error);
        throw error;
    }
}

export async function clearVerseIndex(): Promise<void> {
    try {
        const db = await getDB();
        await db.clear(STORE_NAME);
        await db.delete(META_STORE_NAME, 'index-meta');
        console.log('Cleared verse index from IndexedDB');
    } catch (error) {
        console.error('Error clearing verse index:', error);
        throw error;
    }
}

export async function getVerseIndexMeta(): Promise<{ lastUpdated: number; version: string; totalVerses: number } | null> {
    try {
        const db = await getDB();
        const meta = await db.get(META_STORE_NAME, 'index-meta');
        return meta || null;
    } catch (error) {
        console.error('Error getting verse index meta:', error);
        return null;
    }
}

export async function getVersesByChapter(chapterId: number): Promise<VerseIndex[]> {
    try {
        const db = await getDB();
        const verses = await db.getAllFromIndex(STORE_NAME, 'by-chapter', chapterId);
        return verses.sort((a, b) => a.verse_number - b.verse_number);
    } catch (error) {
        console.error('Error getting verses by chapter:', error);
        return [];
    }
}

export async function getVersesByJuz(juzNumber: number): Promise<VerseIndex[]> {
    try {
        const db = await getDB();
        const verses = await db.getAllFromIndex(STORE_NAME, 'by-juz', juzNumber);
        return verses.sort((a, b) => {
            if (a.chapter_id !== b.chapter_id) {
                return a.chapter_id - b.chapter_id;
            }
            return a.verse_number - b.verse_number;
        });
    } catch (error) {
        console.error('Error getting verses by juz:', error);
        return [];
    }
}

export async function getVersesByPage(pageNumber: number): Promise<VerseIndex[]> {
    try {
        const db = await getDB();
        const verses = await db.getAllFromIndex(STORE_NAME, 'by-page', pageNumber);
        return verses.sort((a, b) => {
            if (a.chapter_id !== b.chapter_id) {
                return a.chapter_id - b.chapter_id;
            }
            return a.verse_number - b.verse_number;
        });
    } catch (error) {
        console.error('Error getting verses by page:', error);
        return [];
    }
}
