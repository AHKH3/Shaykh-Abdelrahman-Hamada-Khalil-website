import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./local-search", () => ({
  searchVersesLocally: vi.fn(),
}));

import { searchVersesLocally } from "./local-search";
import { clearSearchCache, searchWithFallback } from "./search-engine";

describe("searchWithFallback", () => {
  beforeEach(() => {
    clearSearchCache();
    vi.mocked(searchVersesLocally).mockReset();
  });

  it("maps verse results with a resolved pageNumber", async () => {
    vi.mocked(searchVersesLocally).mockResolvedValue({
      results: [
        {
          verse_key: "2:255",
          text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ",
          highlighted: "<mark>اللَّهُ</mark> لَا إِلَٰهَ إِلَّا هُوَ",
          score: 98,
          chapter_id: 2,
          verse_number: 255,
          page_number: 42,
          juz_number: 3,
        },
      ],
      totalResults: 1,
    });

    const result = await searchWithFallback({ query: "الله", page: 1, size: 10 });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      type: "verse",
      verseKey: "2:255",
      surahId: 2,
      pageNumber: 42,
    });
  });
});
