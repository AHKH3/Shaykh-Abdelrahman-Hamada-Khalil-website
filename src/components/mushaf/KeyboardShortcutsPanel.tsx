"use client";

import { Keyboard } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import { useI18n } from "@/lib/i18n/context";
import { MUSHAF_SHORTCUTS } from "@/lib/quran/shortcuts";
import MushafCloseButton from "./ui/MushafCloseButton";

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsPanel({ isOpen, onClose }: KeyboardShortcutsPanelProps) {
  const { t, locale } = useI18n();

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="shortcuts-panel-title"
      zIndex={70}
      containerClassName="flex items-end sm:items-center justify-center p-0 sm:p-4"
      panelClassName="bg-card/95 backdrop-blur-md border border-border/40 rounded-t-3xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden max-w-2xl w-full mx-auto max-h-[85vh]"
    >
      <div className="flex items-center justify-between p-5 border-b border-border/40 bg-primary/5">
        <h3 id="shortcuts-panel-title" className="font-bold text-sm flex items-center gap-2.5 text-primary">
          <Keyboard size={18} />
          {t.mushaf.keyboardShortcuts}
        </h3>
        <MushafCloseButton
          onClick={onClose}
          iconSize={18}
          aria-label={t.common.close}
        />
      </div>

      <div className="overflow-y-auto max-h-[70vh] p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
        <div className="grid grid-cols-1 gap-2">
          {MUSHAF_SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.id}
              className="flex items-center justify-between gap-4 border border-border/40 rounded-xl px-3 py-2.5 bg-muted/20"
            >
              <span className="text-sm text-foreground/90">
                {locale === "ar" ? shortcut.descriptionAr : shortcut.descriptionEn}
              </span>
              <div className="flex items-center gap-1.5">
                {shortcut.keys.map((key) => (
                  <kbd key={`${shortcut.id}-${key}`}>{key}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}
