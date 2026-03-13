"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronDown, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { getTafsir, TAFSIR_RESOURCES, type Tafsir } from "@/lib/quran/api";
import ModalShell from "@/components/ui/ModalShell";
import MushafCloseButton from "./ui/MushafCloseButton";
import MushafButton from "./ui/MushafButton";

interface TafsirPanelProps {
    isOpen: boolean;
    verseKey: string;
    onClose: () => void;
    onPlayVerse: () => void;
}

export default function TafsirPanel({
    isOpen,
    verseKey,
    onClose,
    onPlayVerse,
}: TafsirPanelProps) {
    const { t, locale, dir } = useI18n();
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const [selectedTafsirId, setSelectedTafsirId] = useState(169); // Default: Ibn Kathir Arabic
    const [tafsir, setTafsir] = useState<Tafsir | null>(null);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Filter tafsirs by current locale
    const availableTafsirs = Object.values(TAFSIR_RESOURCES).filter(
        (resource) => resource.language === locale
    );

    const loadTafsir = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getTafsir(verseKey, selectedTafsirId);
            setTafsir(data);
        } catch (error) {
            console.error("Failed to load tafsir:", error);
            setTafsir(null);
        } finally {
            setLoading(false);
        }
    }, [selectedTafsirId, verseKey]);

    // Load tafsir when verseKey or selectedTafsirId changes
    useEffect(() => {
        if (isOpen && verseKey) {
            loadTafsir();
        }
    }, [isOpen, verseKey, loadTafsir]);

    const handleTafsirChange = (id: number) => {
        setSelectedTafsirId(id);
        setShowDropdown(false);
    };

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            titleId="tafsir-panel-title"
            initialFocusRef={closeButtonRef}
            zIndex={70}
            backdropClassName="bg-black/50 backdrop-blur-sm"
            containerClassName="flex items-end sm:items-center justify-center p-0 sm:p-4"
            panelClassName="bg-card/95 backdrop-blur-xl border border-white/10 dark:border-white/5 sm:border-primary/10 rounded-t-3xl sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4),_inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden max-h-[85vh] max-w-2xl w-full mx-auto transition-all duration-500"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 sm:py-4 border-b border-primary/10 bg-primary/5 backdrop-blur-xl relative gap-4 sm:gap-0">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60" />
                <div className="flex items-center gap-4">
                    <MushafButton
                        variant="icon"
                        onClick={onPlayVerse}
                        className="h-10 w-10 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl shadow-sm transition-all duration-300 active:scale-90"
                        title={t.mushaf.audio}
                        icon={<Play size={20} fill="currentColor" className="translate-x-0.5" />}
                    />
                    <div className="flex flex-col gap-1.5 order-1 sm:order-2">
                        <div className="mushaf-engraved-container px-3 py-1 self-start inline-flex items-center gap-2 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                            <span className="mushaf-text-overline font-bold text-primary/80 uppercase tracking-widest whitespace-nowrap drop-shadow-sm">{t.mushaf.verse} {verseKey}</span>
                        </div>
                        <h3 id="tafsir-panel-title" className="font-bold text-xl sm:text-2xl text-primary drop-shadow-sm font-['Amiri',serif] whitespace-nowrap">{t.mushaf.tafsir}</h3>
                    </div>
                </div>
                <MushafCloseButton
                    ref={closeButtonRef}
                    onClick={onClose}
                    iconSize={20}
                    aria-label={t.common.close}
                />
            </div>

            {/* Tafsir Selector */}
            <div className="p-5 sm:p-6 border-b border-primary/10 bg-background/50 relative z-20">
                <div className="relative max-w-md mx-auto sm:mx-0">
                    <MushafButton
                        variant="ghost"
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="w-full px-5 py-3.5 bg-card border border-primary/15 rounded-2xl hover:bg-primary/5 transition-all duration-300 text-sm font-bold card-elevated"
                    >
                        <span className="flex w-full min-w-0 items-center justify-between gap-3 whitespace-nowrap">
                            <span className="text-foreground/90 font-['Inter',sans-serif] truncate drop-shadow-sm text-base">
                                {TAFSIR_RESOURCES[selectedTafsirId]?.name || t.mushaf.selectTafsir}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center flex-shrink-0">
                                <ChevronDown size={18} className={`transition-transform duration-500 text-primary/80 ${showDropdown ? "rotate-180" : ""}`} />
                            </div>
                        </span>
                    </MushafButton>

                    <AnimatePresence>
                        {showDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-full left-0 right-0 mt-3 bg-card/95 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] overflow-hidden z-20 max-h-[40vh] custom-scrollbar py-2"
                            >
                                {availableTafsirs.map((resource) => (
                                    <MushafButton
                                        key={resource.id}
                                        variant="ghost"
                                        onClick={() => handleTafsirChange(resource.id)}
                                        className={`w-full text-start px-5 py-3 transition-colors text-sm font-medium rounded-none border-transparent shadow-none justify-start group relative ${selectedTafsirId === resource.id ? "bg-primary/10 text-primary" : "bg-transparent hover:bg-muted text-foreground/80 hover:text-foreground"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 relative z-10 w-full">
                                            {selectedTafsirId === resource.id && (
                                                <motion.div layoutId="activeTafsirIndicator" className="w-1 h-1 rounded-full bg-primary" />
                                            )}
                                            <span className={`transition-transform duration-300 ${selectedTafsirId !== resource.id ? "group-hover:translate-x-1 group-hover:rtl:-translate-x-1" : ""}`}>
                                                {resource.name}
                                            </span>
                                        </div>
                                    </MushafButton>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Tafsir Content */}
            <div className="p-6 sm:p-10 overflow-x-hidden overflow-y-auto max-h-[50vh] sm:max-h-[60vh] bg-background relative custom-scrollbar">
                <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none opacity-50" />
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-6 relative z-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                            <Loader2 size={40} className="animate-spin text-primary relative z-10 drop-shadow-sm" />
                        </div>
                        <p className="mushaf-text-overline font-bold text-primary/70 uppercase tracking-[0.2em] animate-pulse">{t.common?.loading || "جاري التحميل..."}</p>
                    </div>
                ) : tafsir ? (
                    <div
                        className="prose prose-sm sm:prose-lg max-w-none dark:prose-invert font-['Amiri',serif] leading-[2.2] sm:leading-[2.5] text-foreground/90 selection:bg-primary/20 selection:text-primary relative z-10"
                        dir={dir}
                        dangerouslySetInnerHTML={{ __html: tafsir.text }}
                    />
                ) : (
                    <p className="text-center text-muted-foreground py-12">
                        {locale === "ar" ? "لم يتم العثور على التفسير" : "Tafsir not found"}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="mushaf-text-overline p-5 sm:px-8 sm:py-5 border-t border-primary/10 bg-primary/5 backdrop-blur-xl flex items-center justify-between font-black uppercase tracking-widest text-primary/70 relative">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <div className="flex items-center gap-2 whitespace-nowrap bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0 shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.8)]" />
                    <span className="whitespace-nowrap drop-shadow-sm">{TAFSIR_RESOURCES[selectedTafsirId]?.name}</span>
                </div>
                <span className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-background/50 border border-border/50 shadow-sm">{tafsir?.language_name || ""}</span>
            </div>
        </ModalShell>
    );
}
