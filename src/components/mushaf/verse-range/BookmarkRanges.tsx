"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Play, X, Plus } from "lucide-react";
import { getBookmarks, addBookmark, removeBookmarkByVerseKey } from "@/lib/quran/bookmarks";
import type { Bookmark as BookmarkType } from "@/lib/quran/bookmarks";
import { useI18n } from "@/lib/i18n/context";
import type { Chapter } from "@/lib/quran/api";

interface BookmarkRangesProps {
    chapters: Chapter[];
    onSelectRange: (chapterId: number, from: number, to: number) => void;
    currentChapterId?: number;
    currentFromVerse?: number;
    currentToVerse?: number;
    onPlayVerse?: (verseKey: string) => void;
}

export function BookmarkRanges({
    chapters,
    onSelectRange,
    currentChapterId,
    currentFromVerse,
    currentToVerse,
    onPlayVerse,
}: BookmarkRangesProps) {
    const { t, locale } = useI18n();
    const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [note, setNote] = useState("");

    useEffect(() => {
        loadBookmarks();
    }, []);

    const loadBookmarks = () => {
        setBookmarks(getBookmarks());
    };

    const handleAddCurrentRangeToBookmarks = () => {
        if (currentChapterId && currentFromVerse && currentToVerse) {
            // Add a bookmark for the first verse in the range
            const verseKey = `${currentChapterId}:${currentFromVerse}`;
            const chapter = chapters.find(c => c.id === currentChapterId);
            if (chapter) {
                addBookmark(verseKey, currentChapterId, 1, note || undefined);
                setNote("");
                setShowAddForm(false);
                loadBookmarks();
            }
        }
    };

    const handleRemoveBookmark = (verseKey: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeBookmarkByVerseKey(verseKey);
        loadBookmarks();
    };

    const handleSelectBookmark = (bookmark: BookmarkType) => {
        const [chapterId, verseNum] = bookmark.verseKey.split(":").map(Number);
        const chapter = chapters.find(c => c.id === chapterId);
        if (chapter) {
            // Select a range starting from this verse (next 10 verses or remaining)
            const fromVerse = verseNum;
            const toVerse = Math.min(verseNum + 9, chapter.verses_count);
            onSelectRange(chapterId, fromVerse, toVerse);
        }
    };

    const handlePlayFromBookmark = (verseKey: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (onPlayVerse) {
            onPlayVerse(verseKey);
        }
    };

    const getChapterName = (chapterId: number): string => {
        const chapter = chapters.find(c => c.id === chapterId);
        return chapter ? (locale === "ar" ? chapter.name_arabic : chapter.name_simple) : "";
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bookmark size={16} className="text-primary" />
                    <span className="text-sm font-medium">{t.mushaf.bookmarkedRanges}</span>
                </div>
                {currentChapterId && currentFromVerse && currentToVerse && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                    >
                        <Plus size={14} />
                        <span>{t.mushaf.addCurrentRangeToBookmarks}</span>
                    </motion.button>
                )}
            </div>

            {/* Add Bookmark Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border"
                    >
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={locale === "ar" ? "ملاحظة (اختياري)" : "Note (optional)"}
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            dir={locale === "ar" ? "rtl" : "ltr"}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddCurrentRangeToBookmarks}
                                className="flex-1 px-3 py-2 text-xs bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors"
                            >
                                {t.common.save}
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNote("");
                                }}
                                className="flex-1 px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                            >
                                {locale === "ar" ? "إلغاء" : "Cancel"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bookmarks List */}
            <div className="space-y-2">
                {bookmarks.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        {t.mushaf.noBookmarks}
                    </div>
                ) : (
                    bookmarks.map((bookmark, index) => (
                        <motion.button
                            key={bookmark.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleSelectBookmark(bookmark)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors group"
                            dir={locale === "ar" ? "rtl" : "ltr"}
                        >
                            <span className="flex-shrink-0">
                                <Bookmark size={16} className="text-primary fill-primary/20" />
                            </span>
                            <div className="flex-1 text-right">
                                <div className="text-sm font-medium">
                                    {bookmark.verseKey} - {getChapterName(bookmark.chapterId)}
                                </div>
                                {bookmark.note && (
                                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {bookmark.note}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onPlayVerse && (
                                    <button
                                        onClick={(e) => handlePlayFromBookmark(bookmark.verseKey, e)}
                                        className="p-1.5 hover:bg-accent rounded transition-colors"
                                        title={t.mushaf.playFromBookmark}
                                    >
                                        <Play size={14} className="text-muted-foreground" />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => handleRemoveBookmark(bookmark.verseKey, e)}
                                    className="p-1.5 hover:bg-accent rounded transition-colors"
                                    title={t.mushaf.removeBookmark}
                                >
                                    <X size={14} className="text-muted-foreground hover:text-red-500" />
                                </button>
                            </div>
                        </motion.button>
                    ))
                )}
            </div>
        </div>
    );
}
