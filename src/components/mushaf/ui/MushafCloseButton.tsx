"use client";

import React, { forwardRef } from "react";
import { X } from "lucide-react";

export interface MushafCloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    iconSize?: number;
}

const MushafCloseButton = forwardRef<HTMLButtonElement, MushafCloseButtonProps>(
    ({ className = "", iconSize = 18, title = "Close", ...props }, ref) => {
        return (
            <button
                ref={ref}
                title={title}
                aria-label={title}
                className={`p-2 rounded-xl text-muted-foreground transition-all duration-300 ease-out cursor-pointer active:scale-90 hover:bg-destructive/10 hover:text-destructive group outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 ${className}`.trim()}
                {...props}
            >
                <X
                    size={iconSize}
                    className="transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:scale-110"
                />
            </button>
        );
    }
);

MushafCloseButton.displayName = "MushafCloseButton";

export default MushafCloseButton;
