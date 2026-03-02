import { getTafsir, type Tafsir, type Verse } from "./api";
import type { TafsirScope } from "../hooks/useTafsirWorkspace";

const DEFAULT_MAX_CONCURRENCY = 3;
const DEFAULT_RANGE_CHUNK_SIZE = 20;

const tafsirCache = new Map<string, Tafsir>();
const pendingRequests = new Map<string, Promise<Tafsir>>();

export interface ScopeTafsirEntry {
  verseKey: string;
  tafsir: Tafsir;
}

export interface LoadScopeTafsirOptions {
  scope: TafsirScope | null;
  tafsirId: number;
  offset?: number;
  chunkSize?: number;
  concurrency?: number;
  signal?: AbortSignal;
}

export interface LoadScopeTafsirResult {
  entries: ScopeTafsirEntry[];
  total: number;
  nextOffset: number;
  hasMore: boolean;
}

export function resolveScopeVerseKeys(scope: TafsirScope | null): string[] {
  if (!scope) return [];

  if (scope.mode === "ayah") {
    return scope.verseKey ? [scope.verseKey] : [];
  }

  const unique = new Set<string>();
  for (const verseKey of scope.verseKeys) {
    if (verseKey) unique.add(verseKey);
  }
  return Array.from(unique);
}

export function resolveVerseKeysFromVerses(verses: Verse[]): string[] {
  return verses.map((verse) => verse.verse_key).filter(Boolean);
}

function getCacheKey(tafsirId: number, verseKey: string): string {
  return `${tafsirId}:${verseKey}`;
}

async function getOrLoadTafsir(
  verseKey: string,
  tafsirId: number,
  signal?: AbortSignal
): Promise<Tafsir> {
  const cacheKey = getCacheKey(tafsirId, verseKey);
  const cached = tafsirCache.get(cacheKey);
  if (cached) return cached;

  const pending = pendingRequests.get(cacheKey);
  if (pending) return pending;

  const request = getTafsir(verseKey, tafsirId, { signal })
    .then((tafsir) => {
      tafsirCache.set(cacheKey, tafsir);
      return tafsir;
    })
    .finally(() => {
      pendingRequests.delete(cacheKey);
    });

  pendingRequests.set(cacheKey, request);
  return request;
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  limit: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>
): Promise<TOutput[]> {
  if (items.length === 0) return [];

  const safeLimit = Math.max(1, Math.min(limit, items.length));
  const results = new Array<TOutput>(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: safeLimit }, () => worker()));
  return results;
}

export async function loadScopeTafsir(
  options: LoadScopeTafsirOptions
): Promise<LoadScopeTafsirResult> {
  const {
    scope,
    tafsirId,
    offset = 0,
    chunkSize,
    concurrency = DEFAULT_MAX_CONCURRENCY,
    signal,
  } = options;

  const verseKeys = resolveScopeVerseKeys(scope);
  if (verseKeys.length === 0) {
    return {
      entries: [],
      total: 0,
      nextOffset: 0,
      hasMore: false,
    };
  }

  const safeOffset = Math.max(0, Math.min(offset, verseKeys.length));
  const requestedChunkSize =
    scope?.mode === "range"
      ? chunkSize ?? DEFAULT_RANGE_CHUNK_SIZE
      : verseKeys.length;

  const safeChunkSize = Math.max(1, requestedChunkSize);
  const chunkKeys = verseKeys.slice(safeOffset, safeOffset + safeChunkSize);

  const entries = await mapWithConcurrency(
    chunkKeys,
    concurrency,
    async (verseKey): Promise<ScopeTafsirEntry> => {
      const tafsir = await getOrLoadTafsir(verseKey, tafsirId, signal);
      return { verseKey, tafsir };
    }
  );

  const nextOffset = safeOffset + chunkKeys.length;

  return {
    entries,
    total: verseKeys.length,
    nextOffset,
    hasMore: nextOffset < verseKeys.length,
  };
}

export async function prefetchScopeChunk(options: LoadScopeTafsirOptions): Promise<number> {
  const result = await loadScopeTafsir(options);
  return result.entries.length;
}

export function __clearTafsirServiceCache(): void {
  tafsirCache.clear();
  pendingRequests.clear();
}
