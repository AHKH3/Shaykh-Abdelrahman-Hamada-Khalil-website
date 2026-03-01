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
            containerClassName="relative h-full w-full"
            panelClassName="absolute bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-card/95 backdrop-blur-xl border border-white/10 dark:border-white/5 sm:border-primary/10 rounded-t-3xl sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] overflow-hidden max-h-[85vh] sm:max-w-2xl sm:w-full mx-auto transition-all duration-500"
        >
            <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 bg-primary/5 backdrop-blur-xl relative">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60" />
                <div className="flex items-center gap-4">
                    <MushafButton
                        variant="icon"
                        onClick={onPlayVerse}
                        className="h-10 w-10 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl shadow-sm transition-all duration-300 active:scale-90"
                        title={t.mushaf.audio}
                        icon={<Play size={20} fill="currentColor" className="translate-x-0.5" />}
                    />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary/70 uppercase tracking-[0.2em] whitespace-nowrap">{t.mushaf.verse} {verseKey}</span>
                        <span id="tafsir-panel-title" className="font-bold text-lg text-foreground font-['Amiri',serif] whitespace-nowrap">{t.mushaf.tafsir}</span>
                    </div>
                </div>
                <MushafCloseButton
                    ref={closeButtonRef}
                    onClick={onClose}
                    iconSize={18}
                    aria-label={t.common.close}
                />
            </div>

            {/* Tafsir Selector */}
            <div className="p-6 border-b border-primary/10 bg-background/50">
                <div className="relative">
                    <MushafButton
                        variant="ghost"
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-card border border-primary/10 rounded-2xl hover:bg-primary/5 transition-all duration-300 text-sm font-bold shadow-sm"
                    >
                        <span className="text-foreground/90 font-['Inter',sans-serif] whitespace-nowrap">
                            {TAFSIR_RESOURCES[selectedTafsirId]?.name || t.mushaf.selectTafsir}
                        </span>
                        <ChevronDown size={18} className={`transition-transform duration-500 text-primary/70 ${showDropdown ? "rotate-180" : ""}`} />
                    </MushafButton>

                    <AnimatePresence>
                        {showDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-10 max-h-60 overflow-auto"
                            >
                                {availableTafsirs.map((resource) => (
                                    <MushafButton
                                        key={resource.id}
                                        variant="ghost"
                                        onClick={() => handleTafsirChange(resource.id)}
                                        className={`w-full text-start px-4 py-2.5 hover:bg-muted transition-colors text-sm font-normal rounded-none border-transparent shadow-none justify-start ${selectedTafsirId === resource.id ? "bg-muted" : "bg-transparent"
                                            }`}
                                    >
                                        {resource.name}
                                    </MushafButton>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Tafsir Content */}
            <div className="p-8 overflow-auto max-h-[50vh] sm:max-h-[60vh] bg-background/30 backdrop-blur-sm">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 size={32} className="animate-spin text-primary opacity-70" />
                        <p className="text-xs font-bold text-primary/60 uppercase tracking-widest animate-pulse">{t.common?.loading || "جاري التحميل..."}</p>
                    </div>
                ) : tafsir ? (
                    <div
                        className="prose prose-sm sm:prose-base max-w-none dark:prose-invert font-['Amiri',serif] leading-loose text-foreground/90 selection:bg-primary/20 selection:text-primary"
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
            <div className="p-5 border-t border-primary/10 bg-primary/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary/60">
                <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                    <span className="whitespace-nowrap">{TAFSIR_RESOURCES[selectedTafsirId]?.name}</span>
                </div>
                <span className="whitespace-nowrap">{tafsir?.language_name || ""}</span>
            </div>
        </ModalShell>
    );
}
