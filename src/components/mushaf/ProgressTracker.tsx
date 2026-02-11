"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Flame, Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface ProgressTrackerProps {
    currentPage: number;
}

interface ReadingSession {
    date: string;
    pagesRead: number[];
}

const STORAGE_KEY = "reading_sessions";

export default function ProgressTracker({ currentPage }: ProgressTrackerProps) {
    const { t, locale } = useI18n();
    const [pagesRead, setPagesRead] = useState<Set<number>>(new Set());
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        // Load reading sessions from localStorage
        const loadSessions = () => {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                if (data) {
                    const sessions: ReadingSession[] = JSON.parse(data);
                    const today = new Date().toDateString();
                    const todaySessions = sessions.filter((s) => s.date === today);
                    const totalPagesRead = new Set<number>();

                    // Get all pages read
                    sessions.forEach((session) => {
                        session.pagesRead.forEach((page) => totalPagesRead.add(page));
                    });

                    setPagesRead(totalPagesRead);

                    // Calculate streak
                    const sortedSessions = [...sessions].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );

                    let currentStreak = 0;
                    const todayDate = new Date();

                    for (let i = sortedSessions.length - 1; i >= 0; i--) {
                        const sessionDate = new Date(sortedSessions[i].date);
                        const diffDays = Math.floor(
                            (todayDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
                        );

                        if (diffDays === currentStreak) {
                            currentStreak++;
                        } else if (diffDays > currentStreak + 1) {
                            break;
                        }
                    }

                    setStreak(currentStreak);
                }
            } catch (error) {
                console.error("Failed to load reading sessions:", error);
            }
        };

        loadSessions();

        // Save current page as reading session
        const saveCurrentSession = () => {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                const sessions: ReadingSession[] = data ? JSON.parse(data) : [];
                const today = new Date().toDateString();
                const todaySession = sessions.find((s) => s.date === today);

                if (todaySession) {
                    todaySession.pagesRead.push(currentPage);
                } else {
                    sessions.push({
                        date: today,
                        pagesRead: [currentPage],
                    });
                }

                localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
                loadSessions();
            } catch (error) {
                console.error("Failed to save reading session:", error);
            }
        };

        // Save session every minute
        const interval = setInterval(saveCurrentSession, 60000);
        return () => clearInterval(interval);
    }, [currentPage]);

    const progress = Math.round((pagesRead.size / 604) * 100);

    return (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-xl shadow-lg p-3 z-40 max-w-xs">
            <div className="space-y-2">
                {/* Progress */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{t.mushaf.progress}</span>
                        <span className="text-xs font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-foreground rounded-full"
                        />
                    </div>
                </div>

                {/* Streak */}
                <div className="flex items-center gap-2">
                    <Flame size={14} className="text-amber-500" />
                    <div>
                        <span className="text-xs text-muted-foreground">{t.mushaf.streak}</span>
                        <span className="text-sm font-medium">{streak}</span>
                        <span className="text-xs text-muted-foreground">{t.mushaf.days}</span>
                    </div>
                </div>

                {/* Pages Read */}
                <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-muted-foreground" />
                    <div>
                        <span className="text-xs text-muted-foreground">{locale === "ar" ? "صفحات مقروءة" : "Pages Read"}</span>
                        <span className="text-sm font-medium">{pagesRead.size}</span>
                        <span className="text-xs text-muted-foreground">/ 604</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
