import { SearchResult } from "./api";

const BASE_URL = "https://api.quran.com/api/v4";

/**
 * Perform a raw search request to Quran.com API v4
 * This is separated from api.ts to avoid circular dependencies with search-engine.ts
 */
export async function fetchQuranComSearch(
    query: string,
    language: string = "ar",
    page: number = 1
): Promise<SearchResult> {
    const params = new URLSearchParams({
        q: query,
        size: "20",
        page: page.toString(),
        language: language,
    });

    const res = await fetch(`${BASE_URL}/search?${params}`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) throw new Error("Failed to fetch search results");
    const data = await res.json();
    return data;
}
