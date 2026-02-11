"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/context";

interface TurnPageProps {
    page: number;
    onFlip?: (direction: "next" | "prev") => void;
    children: React.ReactNode;
    onNextPage?: () => void;
    onPrevPage?: () => void;
}

export default function TurnPage({ page, onFlip, children, onNextPage, onPrevPage }: TurnPageProps) {
    const { t, dir } = useI18n();
    const turnRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!turnRef.current) return;

        // Import turn.js dynamically
        const loadTurnJs = async () => {
            try {
                // @ts-ignore - turn.js doesn't have TypeScript types
                const Turn = (await import("turn.js")).default;

                if (Turn) {
                    new Turn(turnRef.current, {
                        width: 800,
                        height: 600,
                        autoCenter: true,
                        duration: 1000,
                        gradients: true,
                        elevation: 50,
                        shadows: true,
                        when: {
                            tap: true,
                            drag: true,
                        },
                        acceleration: true,
                    });
                }
            } catch (error) {
                console.error("Failed to load turn.js:", error);
            }
        };

        loadTurnJs();
    }, []);

    return (
        <div className="relative w-full flex justify-center items-center">
            <div
                ref={turnRef}
                className="turn-page-container"
                style={{ width: "100%", minHeight: "600px" }}
            >
                {children}
            </div>

            {/* Navigation buttons for turn.js */}
            <div className="absolute bottom-4 left-1/2 right-1/2 flex gap-2 z-10">
                <button
                    onClick={() => {
                        onPrevPage?.();
                        onFlip?.("prev");
                    }}
                    className="p-3 bg-card/80 hover:bg-card/60 border border-border rounded-lg shadow-lg transition-all duration-200"
                    disabled={page <= 1}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={dir === "rtl" ? "M9 5l7 7-7 7 7" : "M15 19l-7 7 7 7"} />
                    </svg>
                </button>
                <button
                    onClick={() => {
                        onNextPage?.();
                        onFlip?.("next");
                    }}
                    className="p-3 bg-card/80 hover:bg-card/60 border border-border rounded-lg shadow-lg transition-all duration-200"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={dir === "rtl" ? "M15 19l-7 7 7 7" : "M9 5l7 7-7 7"} />
                    </svg>
                </button>
            </div>
        </div>
    );
}
