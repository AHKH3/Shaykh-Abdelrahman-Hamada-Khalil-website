import React from "react";
import AuthenticFloralFrame from "./frames/AuthenticFloralFrame";

interface MushafFrameProps {
    readingMode: "normal" | "sepia" | "green" | "purple" | "blue" | "red" | "pink" | "highContrast";
    isDark?: boolean;
}

export default function MushafFrame({ readingMode, isDark = false }: MushafFrameProps) {
    // Determine color based on reading mode
    const getBorderColor = () => {
        if (readingMode === "highContrast") return isDark ? "#FFFFFF" : "#000000";

        // Custom authentic colors for each mode - adjusted for the new floral frame to ensure visibility but not overwhelming
        switch (readingMode) {
            case "sepia": return isDark ? "#C6A664" : "#A27F3D"; // Muted Gold/Bronze
            case "green": return isDark ? "#5D7A68" : "#2E5E4E"; // Sage/Forest
            case "purple": return isDark ? "#9D8CA1" : "#6A4C93"; // Muted Purple
            case "blue": return isDark ? "#7FAAC1" : "#1B4F72"; // Steel Blue
            case "red": return isDark ? "#B87E7E" : "#8B0000"; // Muted Red
            case "pink": return isDark ? "#A67A8E" : "#B46482"; // Muted Rose/Pink
            default: return isDark ? "#52525b" : "#71717a"; // Zinc Gray
        }
    };

    const color = getBorderColor();

    return (
        <div className="absolute inset-0 z-0 pointer-events-none select-none rounded-[32px] overflow-hidden">
            <AuthenticFloralFrame color={color} />
        </div>
    );
}
