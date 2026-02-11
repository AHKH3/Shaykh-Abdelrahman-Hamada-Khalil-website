"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, Copy, Share, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface VerseOptionsMenuProps {
    position: { x: number; y: number } | null;
    verseKey: string;
    verseText: string;
    onTafsir: () => void;
    onPlay: () => void;
    onCopy: () => void;
    onShare: () => void;
    onBookmark: () => void;
    isBookmarked: boolean;
    onClose: () => void;
}

export default function VerseOptionsMenu({
    position,
    verseKey,
    verseText,
    onTafsir,
    onPlay,
    onCopy,
    onShare,
    onBookmark,
    isBookmarked,
    onClose,
}: VerseOptionsMenuProps) {
    const { t, locale, dir } = useI18n();

    if (!position) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
                    className="absolute bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[200px]"
                    style={{
                        left: `${Math.min(position.x, window.innerWidth - 220)}px`,
                        top: `${Math.min(position.y, window.innerHeight - 300)}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-1">
                        <button
                            onClick={() => {
                                onTafsir();
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-lg transition-colors text-sm"
                        >
                            <BookOpen size={16} className="text-muted-foreground" />
                            <span>{t.mushaf.tafsir}</span>
                        </button>
                        <button
                            onClick={() => {
                                onPlay();
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-lg transition-colors text-sm"
                        >
                            <Play size={16} className="text-muted-foreground" />
                            <span>{t.mushaf.audio}</span>
                        </button>
                        <button
                            onClick={() => {
                                onCopy();
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-lg transition-colors text-sm"
                        >
                            <Copy size={16} className="text-muted-foreground" />
                            <span>{t.mushaf.copy}</span>
                        </button>
                        <button
                            onClick={() => {
                                onShare();
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-lg transition-colors text-sm"
                        >
                            <Share size={16} className="text-muted-foreground" />
                            <span>{t.mushaf.share}</span>
                        </button>
                        <button
                            onClick={() => {
                                onBookmark();
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-lg transition-colors text-sm"
                        >
                            {isBookmarked ? (
                                <BookmarkCheck size={16} className="text-amber-500" />
                            ) : (
                                <BookmarkPlus size={16} className="text-muted-foreground" />
                            )}
                            <span>{isBookmarked ? t.mushaf.removeBookmark : t.mushaf.addBookmark}</span>
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
