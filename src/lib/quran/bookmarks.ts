export interface Bookmark {
  id: string;
  verseKey: string;      // "2:255"
  chapterId: number;
  pageNumber: number;
  note?: string;
  createdAt: string;
}

const STORAGE_KEY = "quran_bookmarks";

export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load bookmarks:", error);
    return [];
  }
}

export function addBookmark(verseKey: string, chapterId: number, pageNumber: number, note?: string): Bookmark {
  const bookmarks = getBookmarks();
  const newBookmark: Bookmark = {
    id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    verseKey,
    chapterId,
    pageNumber,
    note,
    createdAt: new Date().toISOString(),
  };
  bookmarks.push(newBookmark);
  saveBookmarks(bookmarks);
  return newBookmark;
}

export function removeBookmark(id: string): void {
  const bookmarks = getBookmarks();
  const filtered = bookmarks.filter((b) => b.id !== id);
  saveBookmarks(filtered);
}

export function removeBookmarkByVerseKey(verseKey: string): void {
  const bookmarks = getBookmarks();
  const filtered = bookmarks.filter((b) => b.verseKey !== verseKey);
  saveBookmarks(filtered);
}

export function isBookmarked(verseKey: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some((b) => b.verseKey === verseKey);
}

export function getBookmarkByVerseKey(verseKey: string): Bookmark | undefined {
  const bookmarks = getBookmarks();
  return bookmarks.find((b) => b.verseKey === verseKey);
}

function saveBookmarks(bookmarks: Bookmark[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.error("Failed to save bookmarks:", error);
  }
}
