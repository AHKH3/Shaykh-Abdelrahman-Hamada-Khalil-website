"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface MushafPageFlipButtonProps {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
  disabled: boolean;
  isRtl: boolean;
}

export default function MushafPageFlipButton({
  direction,
  label,
  onClick,
  disabled,
  isRtl,
}: MushafPageFlipButtonProps) {
  const pointsRight = direction === "prev" ? isRtl : !isRtl;
  const Icon = pointsRight ? ChevronRight : ChevronLeft;
  const iconHoverShiftClass = pointsRight ? "group-hover:translate-x-0.5" : "group-hover:-translate-x-0.5";
  const desktopRowClass = pointsRight ? "sm:flex-row-reverse" : "sm:flex-row";
  const textDirection = isRtl ? "rtl" : "ltr";
  const textAlignClass = isRtl ? "text-right" : "text-left";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      dir="ltr"
      className={`group relative inline-flex h-12 min-w-12 sm:min-w-[160px] items-center justify-center gap-3 rounded-full border border-primary/20 bg-gradient-to-b from-primary/95 to-primary px-3 sm:px-5 text-primary-foreground font-bold cursor-pointer transition-all duration-400 ease-out active:scale-95 hover:shadow-[0_12px_30px_-8px_rgba(var(--color-primary-rgb),0.6),_inset_0_1px_2px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:shadow-none disabled:hover:translate-y-0 shadow-[0_8px_20px_-8px_rgba(var(--color-primary-rgb),0.5),_inset_0_1px_1px_rgba(255,255,255,0.2)] ${desktopRowClass}`}
    >
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/20 text-primary-foreground shrink-0 transition-transform duration-400 shadow-inner ${iconHoverShiftClass} group-hover:bg-background/25`}
        aria-hidden
      >
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <span
        dir={textDirection}
        className={`hidden sm:block whitespace-nowrap text-sm leading-none ${textAlignClass}`}
      >
        {label}
      </span>
    </button>
  );
}
