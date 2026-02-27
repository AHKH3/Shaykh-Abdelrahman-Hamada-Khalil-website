"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, Copy, Share2, Bookmark, BookmarkCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import React from "react";

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
    const { t, locale } = useI18n();

    if (!position) return null;

    // Adjust position to keep menu within viewport
    const menuWidth = 220;
    const menuHeight = 300;
    const left = Math.min(position.x, typeof window !== 'undefined' ? window.innerWidth - menuWidth - 20 : position.x);
    const top = Math.min(position.y, typeof window !== 'undefined' ? window.innerHeight - menuHeight - 20 : position.y);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] bg-black/10 backdrop-blur-[2px]"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
                    className="fixed z-[100] min-w-[220px] bg-card/85 backdrop-blur-2xl border border-border/40 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] py-2 overflow-hidden"
                    style={{ left, top }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-4 py-2 mb-1 border-b border-border/30">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {t.mushaf.verse} {verseKey}
                        </span>
                    </div>

                    <div className="space-y-0.5">
                        <MenuButton
                            onClick={() => { onTafsir(); onClose(); }}
                            icon={<BookOpen size={17} />}
                            label={t.mushaf.tafsir}
                        />
                        <MenuButton
                            onClick={() => { onPlay(); onClose(); }}
                            icon={<Play size={17} />}
                            label={t.mushaf.audio}
                        />
                        <MenuButton
                            onClick={() => { onBookmark(); onClose(); }}
                            icon={isBookmarked ? <BookmarkCheck size={17} className="text-primary fill-primary/20" /> : <Bookmark size={17} />}
                            label={isBookmarked ? (t.mushaf.removeBookmark || "إزالة العلامة") : (t.mushaf.addBookmark || "أضف علامة")}
                        />

                        <div className="my-1 border-t border-border/30" />

                        <MenuButton
                            onClick={() => { onCopy(); onClose(); }}
                            icon={<Copy size={17} />}
                            label={t.mushaf.copy || (locale === "ar" ? "نسخ" : "Copy")}
                        />
                        <MenuButton
                            onClick={() => { onShare(); onClose(); }}
                            icon={<Share2 size={17} />}
                            label={t.mushaf.share || (locale === "ar" ? "مشاركة" : "Share")}
                        />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function MenuButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:bg-primary/10 text-foreground/80 hover:text-primary group"
        >
            <span className="transition-transform group-hover:scale-110 duration-300">{icon}</span>
            <span className="font-medium">{label}</span>
        </button>
    );
}
