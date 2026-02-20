"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Star, Trash2, X, Pin, PinOff } from "lucide-react";
import { getRangeHistory, getFavoriteRanges, getPinnedRanges, clearRangeHistory, removeRangeFromFavorites, pinRange, unpinRange, getRelativeTime } from "@/lib/quran/range-utils";
import { useI18n } from "@/lib/i18n/context";

interface RangeHistoryProps {
    onSelectRange: (chapterId: number, from: number, to: number) => void;
    currentChapterId?: number;
    currentFromVerse?: number;
    currentToVerse?: number;
}

type HistoryTab = "recent" | "favorites" | "pinned";

export function RangeHistory({
    onSelectRange,
    currentChapterId,
    currentFromVerse,
    currentToVerse,
}: RangeHistoryProps) {
    const { t, locale } = useI18n();
    const [activeTab, setActiveTab] = useState<HistoryTab>("recent");
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const recentRanges = getRangeHistory();
    const favoriteRanges = getFavoriteRanges();
    const pinnedRanges = getPinnedRanges();

    const handleClearHistory = () => {
        clearRangeHistory();
        setShowClearConfirm(false);
    };

    const handleRemoveFavorite = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeRangeFromFavorites(id);
    };

    const handleTogglePin = (
        chapterId: number,
        chapterName: string,
        fromVerse: number,
        toVerse: number,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();
        const isPinned = pinnedRanges.some(
            p => p.chapterId === chapterId && p.fromVerse === fromVerse && p.toVerse === toVerse
        );

        if (isPinned) {
            const pin = pinnedRanges.find(
                p => p.chapterId === chapterId && p.fromVerse === fromVerse && p.toVerse === toVerse
            );
            if (pin) {
                unpinRange(pin.id);
            }
        } else {
            pinRange(chapterId, chapterName, fromVerse, toVerse);
        }
    };

    const tabs: { id: HistoryTab; labelAr: string; labelEn: string; icon: React.ReactNode }[] = [
        { id: "recent", labelAr: "الأخيرة", labelEn: "Recent", icon: <Clock size={14} /> },
        { id: "favorites", labelAr: "المفضلة", labelEn: "Favorites", icon: <Star size={14} /> },
        { id: "pinned", labelAr: "المثبتة", labelEn: "Pinned", icon: <Pin size={14} /> },
    ];

    const getActiveRanges = () => {
        switch (activeTab) {
            case "recent":
                return recentRanges;
            case "favorites":
                return favoriteRanges;
            case "pinned":
                return pinnedRanges;
            default:
                return [];
        }
    };

    const activeRanges = getActiveRanges();

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-border">
                {tabs.map((tab) => (
                    <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors ${activeTab === tab.id
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab.icon}
                        <span>{locale === "ar" ? tab.labelAr : tab.labelEn}</span>
                    </motion.button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-2">
                {activeRanges.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        {activeTab === "recent" && t.mushaf.noRecentRanges}
                        {activeTab === "favorites" && t.mushaf.noFavoriteRanges}
                        {activeTab === "pinned" && (locale === "ar" ? "لا توجد مدى مثبتة" : "No pinned ranges")}
                    </div>
                ) : (
                    activeRanges.map((item, index) => (
                        <motion.button
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onSelectRange(item.chapterId, item.fromVerse, item.toVerse)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors group"
                            dir={locale === "ar" ? "rtl" : "ltr"}
                        >
                            <span className="flex-shrink-0">
                                {activeTab === "favorites" ? (
                                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                ) : activeTab === "pinned" ? (
                                    <Pin size={16} className="text-primary" />
                                ) : (
                                    <Clock size={16} className="text-muted-foreground" />
                                )}
                            </span>
                            <div className="flex-1 text-right">
                                <div className="text-sm font-medium">
                                    {item.chapterName} {item.fromVerse}-{item.toVerse}
                                </div>
                                {activeTab === "recent" && "timestamp" in item && (
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {getRelativeTime(item.timestamp, locale)}
                                    </div>
                                )}
                                {"note" in item && item.note && (
                                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {item.note}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {activeTab !== "pinned" && (
                                    <button
                                        onClick={(e) => handleTogglePin(item.chapterId, item.chapterName, item.fromVerse, item.toVerse, e)}
                                        className="p-1.5 hover:bg-accent rounded transition-colors"
                                        title={pinnedRanges.some(
                                            p => p.chapterId === item.chapterId && p.fromVerse === item.fromVerse && p.toVerse === item.toVerse
                                        )
                                            ? t.mushaf.unpinRange
                                            : t.mushaf.pinRange
                                        }
                                    >
                                        {pinnedRanges.some(
                                            p => p.chapterId === item.chapterId && p.fromVerse === item.fromVerse && p.toVerse === item.toVerse
                                        ) ? (
                                            <PinOff size={14} className="text-muted-foreground" />
                                        ) : (
                                            <Pin size={14} className="text-muted-foreground" />
                                        )}
                                    </button>
                                )}
                                {activeTab === "favorites" && (
                                    <button
                                        onClick={(e) => handleRemoveFavorite(item.id, e)}
                                        className="p-1.5 hover:bg-accent rounded transition-colors"
                                        title={t.mushaf.removeFromFavorites}
                                    >
                                        <Trash2 size={14} className="text-muted-foreground hover:text-red-500" />
                                    </button>
                                )}
                            </div>
                        </motion.button>
                    ))
                )}
            </div>

            {/* Clear History Button */}
            {activeTab === "recent" && recentRanges.length > 0 && (
                <div className="pt-2 border-t border-border">
                    <AnimatePresence>
                        {showClearConfirm ? (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex gap-2"
                            >
                                <button
                                    onClick={handleClearHistory}
                                    className="flex-1 px-3 py-2 text-xs bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                    {t.mushaf.clearHistory}
                                </button>
                                <button
                                    onClick={() => setShowClearConfirm(false)}
                                    className="flex-1 px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                                >
                                    {locale === "ar" ? "إلغاء" : "Cancel"}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowClearConfirm(true)}
                                className="w-full px-3 py-2 text-xs bg-muted/50 hover:bg-muted text-muted-foreground rounded-lg transition-colors"
                            >
                                {t.mushaf.clearHistory}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
