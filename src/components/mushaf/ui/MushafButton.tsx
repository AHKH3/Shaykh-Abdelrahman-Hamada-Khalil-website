"use client";

import React, { forwardRef } from "react";

export interface MushafButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "ghost" | "icon";
    icon?: React.ReactNode;
    children?: React.ReactNode;
    active?: boolean; // For toggled states in ghost/icon variants
}

const MushafButton = forwardRef<HTMLButtonElement, MushafButtonProps>(
    ({ className, variant = "ghost", icon, active, children, ...props }, ref) => {

        // Base classes applied to all buttons
        const baseClasses = "relative flex items-center justify-center gap-2.5 transition-all duration-300 ease-out cursor-pointer active:scale-95 group overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

        // Variant specific classes
        const variantClasses = {
            primary: "bg-primary text-white font-bold px-5 py-2.5 rounded-xl shadow-[0_8px_20px_-6px_rgba(var(--color-primary),0.4)] hover:shadow-[0_12px_30px_-6px_rgba(var(--color-primary),0.5)] hover:bg-primary/90 border border-white/10 dark:border-white/5",
            ghost: `bg-transparent text-foreground/80 font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/5 hover:text-primary border border-transparent hover:border-primary/10 ${active ? "bg-primary/10 text-primary border-primary/20" : ""}`,
            icon: `p-2.5 rounded-xl text-foreground/70 hover:bg-primary/5 hover:text-primary border border-transparent hover:border-primary/10 ${active ? "bg-primary/15 text-primary shadow-inner border-primary/20" : ""}`
        };

        return (
            <button
                ref={ref}
                className={`${baseClasses} ${variantClasses[variant]} ${className || ""}`.trim()}
                {...props}
            >
                {/* Icon wrapper with hover animation */}
                {icon && (
                    <span className="transition-transform duration-300 ease-out group-hover:scale-110 flex-shrink-0">
                        {icon}
                    </span>
                )}

                {/* Text wrapper */}
                {children && (
                    <div className="relative z-10 flex min-w-0 flex-1 items-center gap-2.5 text-start">
                        {children}
                    </div>
                )}
            </button>
        );
    }
);

MushafButton.displayName = "MushafButton";

export default MushafButton;
