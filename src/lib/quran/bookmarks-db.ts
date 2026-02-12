import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface Bookmark {
  id: string;
  user_id: string;
  verse_key: string;
  chapter_id: number;
  page_number: number;
  note: string | null;
  created_at: string;
}

/**
 * Get all bookmarks for the current user from the database
 */
export async function getDbBookmarks(): Promise<Bookmark[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bookmarks:", error);
    return [];
  }

  return (data as Bookmark[]) || [];
}

/**
 * Add a new bookmark to the database
 */
export async function addDbBookmark(
  verseKey: string,
  chapterId: number,
  pageNumber: number,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { error } = await supabase.from("user_bookmarks").insert({
    user_id: user.id,
    verse_key: verseKey,
    chapter_id: chapterId,
    page_number: pageNumber,
    note: note || null,
  });

  if (error) {
    console.error("Error adding bookmark:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Remove a bookmark by ID
 */
export async function removeDbBookmark(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { error } = await supabase
    .from("user_bookmarks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error removing bookmark:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Remove a bookmark by verse key
 */
export async function removeDbBookmarkByVerseKey(
  verseKey: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { error } = await supabase
    .from("user_bookmarks")
    .delete()
    .eq("verse_key", verseKey)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error removing bookmark:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if a verse is bookmarked in the database
 */
export async function isDbBookmarked(verseKey: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("user_bookmarks")
    .select("id")
    .eq("verse_key", verseKey)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Sync local bookmarks from localStorage to database when user logs in
 */
export async function syncLocalBookmarksToDb(): Promise<{ synced: number; errors: number }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { synced: 0, errors: 0 };
  }

  // Get local bookmarks from localStorage
  const localBookmarksStr = localStorage.getItem("quran_bookmarks");
  if (!localBookmarksStr) {
    return { synced: 0, errors: 0 };
  }

  const localBookmarks = JSON.parse(localBookmarksStr);
  let synced = 0;
  let errors = 0;

  for (const bookmark of localBookmarks) {
    const { error } = await supabase.from("user_bookmarks").insert({
      user_id: user.id,
      verse_key: bookmark.verseKey,
      chapter_id: bookmark.chapterId,
      page_number: bookmark.pageNumber,
      note: bookmark.note || null,
    });

    if (error) {
      console.error("Error syncing bookmark:", error);
      errors++;
    } else {
      synced++;
    }
  }

  // Clear local bookmarks after successful sync
  if (synced > 0 && errors === 0) {
    localStorage.removeItem("quran_bookmarks");
  }

  return { synced, errors };
}
