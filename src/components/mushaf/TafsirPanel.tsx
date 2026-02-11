"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, ChevronDown, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { getTafsir, TAFSIR_RESOURCES, type Tafsir } from "@/lib/quran/api";

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
    const [selectedTafsirId, setSelectedTafsirId] = useState(169); // Default: Ibn Kathir Arabic
    const [tafsir, setTafsir] = useState<Tafsir | null>(null);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Filter tafsirs by current locale
    const availableTafsirs = Object.values(TAFSIR_RESOURCES).filter(
        (resource) => resource.language === locale
    );

    // Load tafsir when verseKey or selectedTafsirId changes
    useEffect(() => {
        if (isOpen && verseKey) {
            loadTafsir();
        }
    }, [isOpen, verseKey, selectedTafsirId]);

    const loadTafsir = async () => {
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
    };

    const handleTafsirChange = (id: number) => {
        setSelectedTafsirId(id);
        setShowDropdown(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                    className={`absolute bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] sm:max-w-2xl sm:w-full mx-auto`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onPlayVerse}
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                                title={t.mushaf.audio}
                            >
                                <Play size={18} />
                            </button>
                            <span className="font-medium text-sm">{verseKey}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            aria-label={t.common.close}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tafsir Selector */}
                    <div className="p-4 border-b border-border">
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="w-full flex items-center justify-between px-4 py-2.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm"
                            >
                                <span className="font-medium">
                                    {TAFSIR_RESOURCES[selectedTafsirId]?.name || t.mushaf.selectTafsir}
                                </span>
                                <ChevronDown size={16} className={`transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                            </button>

                            <AnimatePresence>
                                {showDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-10 max-h-60 overflow-auto"
                                    >
                                        {availableTafsirs.map((resource) => (
                                            <button
                                                key={resource.id}
                                                onClick={() => handleTafsirChange(resource.id)}
                                                className={`w-full text-start px-4 py-2.5 hover:bg-muted transition-colors text-sm ${selectedTafsirId === resource.id ? "bg-muted" : ""
                                                    }`}
                                            >
                                                {resource.name}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Tafsir Content */}
                    <div className="p-4 overflow-auto max-h-[50vh] sm:max-h-[60vh]">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={24} className="animate-spin text-muted-foreground" />
                            </div>
                        ) : tafsir ? (
                            <div
                                className="prose prose-sm max-w-none dark:prose-invert"
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
                    <div className="p-4 border-t border-border bg-muted/50 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{TAFSIR_RESOURCES[selectedTafsirId]?.name}</span>
                        <span>{tafsir?.language_name || ""}</span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
