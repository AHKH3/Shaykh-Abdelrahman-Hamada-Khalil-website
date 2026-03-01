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
      className={`group relative inline-flex h-11 min-w-11 sm:min-w-[148px] items-center justify-center gap-2.5 rounded-2xl border border-primary/10 bg-primary/5 px-2.5 sm:px-3.5 text-foreground/85 font-semibold cursor-pointer transition-all duration-300 ease-out active:scale-95 hover:bg-primary/10 hover:text-primary hover:border-primary/25 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 ${desktopRowClass}`}
    >
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg bg-background/85 border border-primary/15 text-primary shrink-0 transition-transform duration-300 ${iconHoverShiftClass}`}
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
