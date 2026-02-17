#!/usr/bin/env node

/**
 * Generate static Quran data JSON file for local search.
 * Fetches all 6236 verses from Quran.com API and saves them
 * as a compact JSON file in public/data/quran-data.json.
 *
 * Usage: node scripts/generate-quran-data.mjs
 */

const BASE_URL = 'https://api.quran.com/api/v4';
const OUTPUT_PATH = new URL('../public/data/quran-data.json', import.meta.url);

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Arabic diacritics (tashkeel) regex
const TASHKEEL_RE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/g;
// Small high/low letters and other Quranic marks
const QURAN_MARKS_RE = /[\u06D6-\u06ED\u0615-\u061A]/g;

/**
 * Normalize Arabic text for search:
 * - Strip all tashkeel (diacritics)
 * - Normalize alef variants to bare alef
 * - Normalize taa marbuta to haa
 * - Normalize alef maqsura to yaa
 */
function normalizeArabic(text) {
    return text
        .replace(TASHKEEL_RE, '')
        .replace(QURAN_MARKS_RE, '')
        .replace(/[إأآٱ]/g, 'ا')  // Alef variants → Alef
        .replace(/ة/g, 'ه')        // Taa marbuta → Haa
        .replace(/ى/g, 'ي')        // Alef maqsura → Yaa
        .replace(/\s+/g, ' ')      // Collapse whitespace
        .trim();
}

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
}

async function main() {
    console.log('🕌 Generating Quran data file...\n');

    // 1. Fetch all chapters to know verse counts
    console.log('📖 Fetching chapter info...');
    const { chapters } = await fetchJSON(`${BASE_URL}/chapters?language=ar`);
    console.log(`   Found ${chapters.length} surahs\n`);

    const allVerses = [];
    let totalFetched = 0;

    // 2. Fetch verses for each chapter
    for (const chapter of chapters) {
        process.stdout.write(`   📜 Surah ${chapter.id}/${chapters.length} (${chapter.name_arabic})...`);

        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: '50',
                words: 'false',
                fields: 'text_uthmani,chapter_id,verse_number,page_number,juz_number',
            });

            const data = await fetchJSON(`${BASE_URL}/verses/by_chapter/${chapter.id}?${params}`);
            const verses = data.verses || [];

            for (const verse of verses) {
                allVerses.push({
                    id: verse.verse_key,
                    t: verse.text_uthmani,
                    tn: normalizeArabic(verse.text_uthmani),
                    c: verse.chapter_id,
                    v: verse.verse_number,
                    p: verse.page_number,
                    j: verse.juz_number,
                });
                totalFetched++;
            }

            // Check pagination
            if (!verses.length || page >= (data.pagination?.total_pages || 1)) {
                hasMore = false;
            }
            page++;
        }

        process.stdout.write(` ✅ (${chapter.verses_count} verses)\n`);
    }

    console.log(`\n📊 Total verses fetched: ${totalFetched}`);

    // 3. Write to file
    const outputDir = dirname(fileURLToPath(OUTPUT_PATH));
    mkdirSync(outputDir, { recursive: true });

    const jsonData = JSON.stringify({ verses: allVerses });
    const outputFilePath = fileURLToPath(OUTPUT_PATH);
    writeFileSync(outputFilePath, jsonData, 'utf-8');

    const sizeMB = (Buffer.byteLength(jsonData) / 1024 / 1024).toFixed(2);
    console.log(`\n✅ Written to: ${outputFilePath}`);
    console.log(`📦 File size: ${sizeMB} MB`);
    console.log('\n🎉 Done! Quran data is ready for local search.');
}

main().catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
