"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, Trash2, ArrowUpRight } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import MushafCloseButton from "./ui/MushafCloseButton";
import MushafButton from "./ui/MushafButton";
import {
  BOOKMARKS_UPDATED_EVENT,
  getBookmarks,
  removeBookmark,
  type Bookmark as BookmarkItem,
} from "@/lib/quran/bookmarks";
import { useI18n } from "@/lib/i18n/context";

interface BookmarksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (pageNumber: number, verseKey: string) => void;
}

export default function BookmarksPanel({ isOpen, onClose, onNavigate }: BookmarksPanelProps) {
  const { t, locale } = useI18n();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  const loadBookmarks = useCallback(() => {
    const next = getBookmarks().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    setBookmarks(next);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const refreshTimer = window.setTimeout(() => loadBookmarks(), 0);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "quran_bookmarks") {
        loadBookmarks();
      }
    };

    const handleBookmarksUpdated = () => loadBookmarks();

    window.addEventListener("storage", handleStorage);
    window.addEventListener(BOOKMARKS_UPDATED_EVENT, handleBookmarksUpdated);
    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(BOOKMARKS_UPDATED_EVENT, handleBookmarksUpdated);
    };
  }, [isOpen, loadBookmarks]);

  const handleRemove = (bookmarkId: string) => {
    removeBookmark(bookmarkId);
    loadBookmarks();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="bookmarks-panel-title"
      zIndex={70}
      backdropClassName="bg-black/50 backdrop-blur-sm"
      containerClassName="flex items-end sm:items-center justify-center p-0 sm:p-4"
      panelClassName="bg-card/95 backdrop-blur-xl border border-white/10 dark:border-white/5 sm:border-primary/10 rounded-t-3xl sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] overflow-hidden max-w-lg w-full mx-auto max-h-[85vh] transition-all duration-500"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 bg-primary/5 backdrop-blur-xl relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60" />
        <h3 id="bookmarks-panel-title" className="font-bold text-lg flex items-center gap-3 text-primary drop-shadow-sm font-['Amiri',serif]">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bookmark size={20} fill="currentColor" />
          </div>
          {t.mushaf.bookmarks}
        </h3>
        <MushafCloseButton
          onClick={onClose}
          iconSize={18}
          aria-label={t.common.close}
        />
      </div>

      <div className="p-4 overflow-y-auto max-h-[70vh] space-y-2" dir={locale === "ar" ? "rtl" : "ltr"}>
        {bookmarks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">{t.mushaf.noBookmarks}</div>
        ) : (
          bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="group/item flex items-center gap-2 rounded-2xl border border-primary/10 bg-card hover:bg-primary/5 p-4 transition-all duration-300 shadow-sm hover:shadow-md hover:border-primary/20"
            >
              <MushafButton
                variant="ghost"
                onClick={() => {
                  onNavigate(bookmark.pageNumber, bookmark.verseKey);
                  onClose();
                }}
                className="flex-1 min-w-0 text-start h-auto p-0 justify-start hover:bg-transparent font-normal bg-transparent"
              >
                <div className="flex flex-col gap-1 whitespace-nowrap">
                  <p className="text-base font-bold text-foreground group-hover/item:text-primary transition-colors whitespace-nowrap">{bookmark.verseKey}</p>
                  <p className="mushaf-text-overline font-black text-primary/60 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-1 h-1 rounded-full bg-primary/40 flex-shrink-0" />
                    {t.mushaf.page} {bookmark.pageNumber}
                  </p>
                  {bookmark.note && <p className="mushaf-text-meta text-muted-foreground/80 truncate mt-1 italic border-s-2 border-primary/20 ps-2">{bookmark.note}</p>}
                </div>
              </MushafButton>

              <MushafButton
                variant="icon"
                onClick={() => {
                  onNavigate(bookmark.pageNumber, bookmark.verseKey);
                  onClose();
                }}
                className="h-10 w-10 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl transition-all duration-300 opacity-0 group-hover/item:opacity-100"
                title={locale === "ar" ? "انتقال" : "Go"}
                icon={<ArrowUpRight size={18} />}
              />

              <MushafButton
                variant="icon"
                onClick={() => handleRemove(bookmark.id)}
                className="h-10 w-10 bg-destructive/5 hover:bg-destructive/10 text-destructive/70 hover:text-destructive rounded-xl transition-all duration-300 opacity-0 group-hover/item:opacity-100"
                title={t.common.delete}
                icon={<Trash2 size={18} />}
              />
            </div>
          ))
        )}
      </div>
    </ModalShell>
  );
}
