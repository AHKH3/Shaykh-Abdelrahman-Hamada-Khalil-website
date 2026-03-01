import { describe, expect, it } from "vitest";
import { JUZ_START_PAGES, validateVerseRange, type Chapter } from "./api";

const chapterFixture: Chapter = {
  id: 1,
  revelation_place: "makkah",
  revelation_order: 5,
  bismillah_pre: true,
  name_simple: "Al-Fatihah",
  name_complex: "Al-Fatihah",
  name_arabic: "الفاتحة",
  verses_count: 7,
  pages: [1, 1],
  translated_name: {
    language_name: "english",
    name: "The Opening",
  },
};

describe("JUZ_START_PAGES", () => {
  it("contains known boundaries for first/middle/last juz", () => {
    expect(JUZ_START_PAGES[1]).toBe(1);
    expect(JUZ_START_PAGES[15]).toBe(282);
    expect(JUZ_START_PAGES[30]).toBe(582);
  });

  it("is monotonic for all 30 ajzaa", () => {
    for (let juz = 2; juz <= 30; juz += 1) {
      expect(JUZ_START_PAGES[juz]).toBeGreaterThan(JUZ_START_PAGES[juz - 1]);
    }
  });
});

describe("validateVerseRange", () => {
  const chapters = [chapterFixture];

  it("returns invalid when range exceeds chapter bounds", () => {
    const result = validateVerseRange(1, 1, 10, chapters);
    expect(result.valid).toBe(false);
    expect(result.errorEn).toContain("only 7 verses");
  });

  it("returns invalid when fromVerse is greater than toVerse", () => {
    const result = validateVerseRange(1, 6, 2, chapters);
    expect(result.valid).toBe(false);
    expect(result.errorEn).toContain("must be less");
  });

  it("returns valid for a correct range", () => {
    const result = validateVerseRange(1, 1, 7, chapters);
    expect(result.valid).toBe(true);
  });
});
