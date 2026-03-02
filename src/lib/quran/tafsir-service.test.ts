import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TafsirScope } from "../hooks/useTafsirWorkspace";
import { getTafsir } from "./api";
import {
  __clearTafsirServiceCache,
  loadScopeTafsir,
  resolveScopeVerseKeys,
} from "./tafsir-service";

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return {
    ...actual,
    getTafsir: vi.fn(),
  };
});

const getTafsirMock = vi.mocked(getTafsir);

function buildRangeScope(size: number): TafsirScope {
  return {
    mode: "range",
    chapterId: 2,
    fromVerse: 1,
    toVerse: size,
    verseKeys: Array.from({ length: size }, (_, idx) => `2:${idx + 1}`),
  };
}

describe("tafsir-service", () => {
  beforeEach(() => {
    __clearTafsirServiceCache();
    vi.clearAllMocks();

    getTafsirMock.mockImplementation(async (verseKey, tafsirId) => {
      return {
        id: Number(verseKey.split(":")[1]),
        resource_id: tafsirId,
        text: `<p>${verseKey}</p>`,
        verse_key: verseKey,
        verse_id: Number(verseKey.split(":")[1]),
        language_name: "arabic",
        resource_name: "ibn-kathir",
      };
    });
  });

  it("resolves scope verse keys", () => {
    expect(resolveScopeVerseKeys({ mode: "ayah", verseKey: "1:1" })).toEqual(["1:1"]);
    expect(resolveScopeVerseKeys({ mode: "ayah", verseKey: null })).toEqual([]);
    expect(resolveScopeVerseKeys(null)).toEqual([]);
  });

  it("chunks range scope with default chunk size (20)", async () => {
    const scope = buildRangeScope(45);

    const first = await loadScopeTafsir({ scope, tafsirId: 169 });
    expect(first.entries).toHaveLength(20);
    expect(first.nextOffset).toBe(20);
    expect(first.hasMore).toBe(true);

    const second = await loadScopeTafsir({ scope, tafsirId: 169, offset: first.nextOffset });
    expect(second.entries).toHaveLength(20);
    expect(second.nextOffset).toBe(40);
    expect(second.hasMore).toBe(true);

    const third = await loadScopeTafsir({ scope, tafsirId: 169, offset: second.nextOffset });
    expect(third.entries).toHaveLength(5);
    expect(third.nextOffset).toBe(45);
    expect(third.hasMore).toBe(false);
  });

  it("deduplicates concurrent requests for the same tafsir key", async () => {
    const scope: TafsirScope = {
      mode: "ayah",
      verseKey: "2:255",
    };

    const [a, b] = await Promise.all([
      loadScopeTafsir({ scope, tafsirId: 169 }),
      loadScopeTafsir({ scope, tafsirId: 169 }),
    ]);

    expect(a.entries[0]?.tafsir.text).toContain("2:255");
    expect(b.entries[0]?.tafsir.text).toContain("2:255");
    expect(getTafsirMock).toHaveBeenCalledTimes(1);
  });

  it("propagates abort errors", async () => {
    const controller = new AbortController();

    getTafsirMock.mockImplementationOnce(async () => {
      controller.abort();
      throw new DOMException("Aborted", "AbortError");
    });

    const scope: TafsirScope = {
      mode: "ayah",
      verseKey: "1:1",
    };

    await expect(
      loadScopeTafsir({ scope, tafsirId: 169, signal: controller.signal })
    ).rejects.toThrow();
  });
});
