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
            primary: "bg-gradient-to-b from-primary/95 to-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl shadow-[0_8px_20px_-6px_rgba(var(--color-primary-rgb),0.5),_inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_30px_-6px_rgba(var(--color-primary-rgb),0.6),_inset_0_1px_1px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 border border-primary/20",
            ghost: `bg-transparent text-foreground/80 font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/5 hover:text-primary hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-transparent hover:border-primary/10 ${active ? "bg-gradient-to-b from-primary/10 to-primary/5 text-primary border-primary/20 shadow-[inset_0_1px_2px_rgba(var(--color-primary-rgb),0.1)]" : ""}`,
            icon: `p-2.5 rounded-xl text-foreground/70 hover:bg-gradient-to-b hover:from-primary/10 hover:to-primary/5 hover:text-primary hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-transparent hover:border-primary/20 ${active ? "bg-gradient-to-b from-primary/15 to-primary/10 text-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.05),_0_1px_0_rgba(255,255,255,0.4)] border-primary/30" : ""}`
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
