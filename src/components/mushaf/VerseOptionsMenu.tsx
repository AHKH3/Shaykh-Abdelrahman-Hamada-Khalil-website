"use client";

import { BookOpen, Play, Copy, Share2, Bookmark, BookmarkCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import React from "react";
import ModalShell from "@/components/ui/ModalShell";
import MushafButton from "./ui/MushafButton";

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
        <ModalShell
            isOpen={Boolean(position)}
            onClose={onClose}
            titleId="verse-options-menu-title"
            zIndex={90}
            backdropClassName="bg-black/10 backdrop-blur-[2px]"
            containerClassName="relative h-full w-full"
            panelClassName="fixed z-[var(--z-context-menu)] min-w-[240px] bg-card/95 backdrop-blur-xl border border-primary/10 rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] py-3 overflow-hidden"
            panelStyle={{ left, top }}
        >
            <div className="px-5 py-3 mb-2 border-b border-primary/10 bg-primary/5 backdrop-blur-xl relative">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60" />
                <span id="verse-options-menu-title" className="mushaf-text-overline font-black text-primary/60 uppercase tracking-[0.2em]">
                    {t.mushaf.verse} {verseKey}
                </span>
                <p className="mushaf-text-compact mt-1.5 text-foreground/90 line-clamp-2 font-['Amiri',serif] leading-relaxed" dir="rtl">
                    {verseText}
                </p>
            </div>

            <div className="px-2 space-y-1">
                <MushafButton
                    variant="ghost"
                    onClick={() => { onTafsir(); onClose(); }}
                    icon={<BookOpen size={18} className="text-primary/70" />}
                    className="w-full justify-start rounded-xl px-4 py-2.5 hover:bg-primary/10 transition-all duration-300 group"
                >
                    <span className="group-hover:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform">{t.mushaf.tafsir}</span>
                </MushafButton>
                <MushafButton
                    variant="ghost"
                    onClick={() => { onPlay(); onClose(); }}
                    icon={<Play size={18} className="text-primary/70" />}
                    className="w-full justify-start rounded-xl px-4 py-2.5 hover:bg-primary/10 transition-all duration-300 group"
                >
                    <span className="group-hover:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform">{t.mushaf.audio}</span>
                </MushafButton>
                <MushafButton
                    variant="ghost"
                    onClick={() => { onBookmark(); onClose(); }}
                    icon={isBookmarked ? <BookmarkCheck size={18} className="text-primary fill-primary/30" /> : <Bookmark size={18} className="text-primary/70" />}
                    className="w-full justify-start rounded-xl px-4 py-2.5 hover:bg-primary/10 transition-all duration-300 group"
                >
                    <span className="group-hover:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform">
                        {isBookmarked ? (t.mushaf.removeBookmark || "إزالة العلامة") : (t.mushaf.addBookmark || "أضف علامة")}
                    </span>
                </MushafButton>

                <div className="mx-4 my-2 border-t border-primary/10" />

                <MushafButton
                    variant="ghost"
                    onClick={() => { onCopy(); onClose(); }}
                    icon={<Copy size={18} className="text-primary/70" />}
                    className="w-full justify-start rounded-xl px-4 py-2.5 hover:bg-primary/10 transition-all duration-300 group"
                >
                    <span className="group-hover:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform">
                        {t.mushaf.copy || (locale === "ar" ? "نسخ" : "Copy")}
                    </span>
                </MushafButton>
                <MushafButton
                    variant="ghost"
                    onClick={() => { onShare(); onClose(); }}
                    icon={<Share2 size={18} className="text-primary/70" />}
                    className="w-full justify-start rounded-xl px-4 py-2.5 hover:bg-primary/10 transition-all duration-300 group"
                >
                    <span className="group-hover:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform">
                        {t.mushaf.share || (locale === "ar" ? "مشاركة" : "Share")}
                    </span>
                </MushafButton>
            </div>
        </ModalShell>
    );
}
