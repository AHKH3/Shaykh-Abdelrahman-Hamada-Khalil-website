import React from "react";

interface MushafPageFrameProps {
    children: React.ReactNode;
    chapterName?: string | null;
    chapterId?: number;
    juzLabel?: string;
    juz?: number;
    pageNumber?: number;
    isRangeMode?: boolean;
    fromVerse?: number;
    toVerse?: number;
    locale?: string;
    fontSizeClass?: string;
}

export default function MushafPageFrame({
    children,
    chapterName,
    chapterId,
    juzLabel,
    juz,
    pageNumber,
    isRangeMode = false,
    fromVerse,
    toVerse,
    locale = "ar",
    fontSizeClass = "text-4xl",
}: MushafPageFrameProps) {
    return (
        <div className="relative group/frame mx-auto w-full transition-all duration-700">
            {/* Background deep glow effects */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-primary/10 via-background to-primary/5 blur-3xl opacity-60 group-hover/frame:opacity-100 transition-opacity duration-1000 rounded-[3rem] -z-20 pointer-events-none" />
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/15 via-transparent to-primary/5 blur-xl opacity-50 group-hover/frame:opacity-80 transition-opacity duration-700 rounded-[2.5rem] -z-10 pointer-events-none" />
            <div className="absolute -inset-[1px] bg-gradient-to-b from-primary/30 to-border/40 rounded-[2rem] -z-10 pointer-events-none" />

            {/* Main Container */}
            <div className="bg-card/95 backdrop-blur-xl border border-white/10 dark:border-white/5 sm:border-primary/10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15),_inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_25px_70px_-15px_rgba(var(--color-primary),0.08),_inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-700 overflow-hidden relative">

                {/* Subtle top inner highlight */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60 pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-[200px] bg-gradient-to-b from-primary/5 to-transparent opacity-50 pointer-events-none mix-blend-overlay" />

                <div className="p-6 sm:p-10 relative z-10">
                    {/* Header Info (Juz & Page for standard mode) */}
                    {!isRangeMode && juz !== undefined && pageNumber !== undefined && (
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40 opacity-60 hover:opacity-100 transition-opacity duration-500">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-primary/80 drop-shadow-sm">
                                {juzLabel} {juz}
                            </span>
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/5 text-primary text-xs font-bold ring-1 ring-primary/20">
                                {pageNumber}
                            </span>
                        </div>
                    )}

                    {/* Surah/Range Header (Mainly for Range mode or first verse of Surah) */}
                    {isRangeMode && chapterName && (
                        <div className="text-center mb-10 relative">
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                            <div className="inline-block relative z-10 px-10 py-4 bg-background/80 backdrop-blur-md rounded-2xl border border-primary/20 shadow-lg shadow-primary/5 ring-1 ring-white/5">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl pointer-events-none" />
                                <h2 className="relative text-2xl font-bold font-['Amiri',serif] text-primary drop-shadow-[0_2px_4px_rgba(var(--color-primary),0.2)] whitespace-nowrap">
                                    {chapterName}
                                </h2>
                                {(fromVerse !== undefined && toVerse !== undefined) && (
                                    <p className="relative text-sm text-mushaf-muted mt-2 font-medium">
                                        {locale === "ar"
                                            ? `الآيات ${fromVerse} - ${toVerse}`
                                            : `Verses ${fromVerse} - ${toVerse}`}
                                    </p>
                                )}
                            </div>

                            {/* Bismillah for Range Mode if starting at verse 1 */}
                            {(fromVerse === 1 && chapterId !== 1 && chapterId !== 9) && (
                                <div className="mt-8 relative group cursor-default">
                                    <div className="absolute -inset-4 bg-primary/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-full" />
                                    <p className={`relative font-['Amiri',serif] text-primary/90 drop-shadow-[0_1px_2px_rgba(var(--color-primary),0.1)] ${fontSizeClass} transition-all duration-500`}>
                                        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Verses Content */}
                    <div className="relative z-10">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
