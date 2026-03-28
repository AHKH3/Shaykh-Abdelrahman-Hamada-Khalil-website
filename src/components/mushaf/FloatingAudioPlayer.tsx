"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  Volume1,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  Repeat,
  Repeat1,
  Music2,
  Timer,
  Settings2,
  ChevronUp,
} from "lucide-react";
import FloatingPanel from "./FloatingPanel";
import { RECITERS } from "@/lib/quran/api";
import { useI18n } from "@/lib/i18n/context";
import MushafButton from "./ui/MushafButton";

export type AudioRepeatMode = "none" | "one" | "all" | "verse" | "range";

interface FloatingAudioPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  currentVerseKey: string | null;
  currentVerseText?: string;
  selectedReciter: number;
  onSetReciter: (id: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onNextVerse: () => void;
  onPrevVerse: () => void;
  audioDuration: number; // seconds
  audioCurrentTime: number; // seconds
  onSeek: (time: number) => void;
  audioVolume: number; // 0-1
  onSetVolume: (vol: number) => void;
  audioSpeed: number;
  onSetSpeed: (speed: number) => void;
  repeatMode: AudioRepeatMode;
  onSetRepeatMode: (mode: AudioRepeatMode) => void;
  // Advanced repeat options for self-memorization
  verseRepeatCount?: number;
  onSetVerseRepeatCount?: (count: number) => void;
  rangeRepeatCount?: number;
  onSetRangeRepeatCount?: (count: number) => void;
  pauseBetweenVerses?: number; // seconds
  onSetPauseBetweenVerses?: (seconds: number) => void;
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function FloatingAudioPlayer({
  isOpen,
  onClose,
  isPlaying,
  currentVerseKey,
  currentVerseText,
  selectedReciter,
  onSetReciter,
  onPlay,
  onPause,
  onNextVerse,
  onPrevVerse,
  audioDuration,
  audioCurrentTime,
  onSeek,
  audioVolume,
  onSetVolume,
  audioSpeed,
  onSetSpeed,
  repeatMode,
  onSetRepeatMode,
  verseRepeatCount = 3,
  onSetVerseRepeatCount,
  rangeRepeatCount = 3,
  onSetRangeRepeatCount,
  pauseBetweenVerses = 2,
  onSetPauseBetweenVerses,
}: FloatingAudioPlayerProps) {
  const { t, locale } = useI18n();
  const [showAdvancedRepeat, setShowAdvancedRepeat] = useState(false);

  const isRtl = locale === "ar";

  const cycleRepeat = () => {
    const modes: AudioRepeatMode[] = ["none", "all", "one", "verse", "range"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onSetRepeatMode(modes[nextIndex]);
  };

  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;

  const VolumeIcon =
    audioVolume === 0 ? VolumeX : audioVolume < 0.5 ? Volume1 : Volume2;

  const progressPercent = Math.max(0, Math.min(100, audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0));

  return (
    <FloatingPanel
      id="audio-player"
      title={t.mushaf.audioPlayer}
      icon={<Music2 size={15} />}
      isOpen={isOpen}
      onClose={onClose}
      minWidth={340}
      defaultPanelHeight={320}
      zIndex={60}
    >
      <div data-testid="mushaf-audio-panel" className="p-4 space-y-4" dir={isRtl ? "rtl" : "ltr"}>

        {/* Reciter Selector (Moved to Top) */}
        <div className="relative group p-1 mushaf-engraved-container flex items-center rounded-xl transition-all focus-within:shadow-[inset_0_4px_8px_-2px_rgba(0,0,0,0.15)] focus-within:border-primary/40">
          <select
            value={selectedReciter}
            onChange={(e) => onSetReciter(Number(e.target.value))}
            className="w-full bg-transparent border-none outline-none text-[13px] font-bold text-primary/90 hover:text-primary transition-colors cursor-pointer appearance-none px-3 py-2"
            dir={isRtl ? "rtl" : "ltr"}
          >
            {RECITERS.map((r) => (
              <option key={r.id} value={r.id} className="bg-card text-foreground font-bold py-2">
                {isRtl ? `${r.name}` : `${r.nameEn}`}
              </option>
            ))}
          </select>
          <div className={`absolute pointer-events-none transition-transform group-hover:scale-110 flex items-center justify-center p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 ${isRtl ? "left-2" : "right-2"}`}>
            <ChevronDown size={14} className="text-primary/70" />
          </div>
        </div>

        {/* Now Playing Card */}
        <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent backdrop-blur-md p-5 flex flex-col justify-center gap-3 relative overflow-hidden group/card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <div className="absolute top-0 end-0 p-3 opacity-5 group-hover/card:opacity-10 transition-opacity">
            <Music2 size={60} className="text-primary" />
          </div>
          {currentVerseKey ? (
            <>
              <div className="flex items-center gap-2.5 relative z-10">
                <span className="mushaf-text-overline font-black text-primary/60 uppercase tracking-[0.2em] bg-primary/5 px-2 py-1 rounded-md">
                  {t.mushaf.nowPlaying}
                </span>
                <span
                  className="mushaf-text-meta font-bold text-primary bg-primary/10 border border-primary/10 px-2.5 py-0.5 rounded-full shadow-sm"
                  dir="ltr"
                >
                  {currentVerseKey}
                </span>
              </div>
              {currentVerseText && (
                <p
                  className="text-lg text-foreground/90 font-['Amiri',serif] leading-relaxed line-clamp-2 relative z-10 drop-shadow-sm mt-1"
                  dir="rtl"
                >
                  {currentVerseText}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-primary/50 text-center flex items-center justify-center gap-2 italic py-4">
              <Music2 size={16} className="opacity-40 animate-pulse text-primary" />
              {t.mushaf.noVerseSelected}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div
            className="relative h-2 bg-muted rounded-full cursor-pointer group overflow-hidden"
            onClick={(e) => {
              if (!audioDuration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = isRtl
                ? rect.right - e.clientX
                : e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              onSeek(ratio * audioDuration);
            }}
          >
            {/* Fill */}
            <div
              className="absolute inset-y-0 start-0 bg-primary rounded-full transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ [isRtl ? "right" : "left"]: `calc(${progressPercent}% - 6px)` }}
            />
          </div>
          <div className="mushaf-text-meta flex justify-between text-muted-foreground tabular-nums" dir="ltr">
            <span>{formatTime(audioCurrentTime)}</span>
            <span>{formatTime(audioDuration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6 py-4">
          <MushafButton
            variant="ghost"
            onClick={onPrevVerse}
            disabled={!currentVerseKey}
            icon={<SkipBack size={26} className="rtl:rotate-180 transition-transform" />}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-transparent hover:bg-primary/10 transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed group text-primary/80 hover:text-primary active:scale-90"
            title={t.mushaf.prevVerse}
          />

          <button
            onClick={isPlaying ? onPause : onPlay}
            className={`w-16 h-16 flex items-center justify-center rounded-full transition-all duration-300 active:scale-95 bg-primary text-primary-foreground shadow-[0_8px_20px_-6px_rgba(var(--color-primary-rgb),0.5)] hover:shadow-[0_12px_25px_-6px_rgba(var(--color-primary-rgb),0.6)] hover:-translate-y-0.5 outline-none`}
            title={isPlaying ? t.mushaf.pause : t.mushaf.audio}
          >
            {isPlaying ? (
              <Pause size={28} fill="currentColor" className="animate-in fade-in zoom-in duration-300" />
            ) : (
              <Play size={28} fill="currentColor" className="translate-x-0.5 animate-in fade-in zoom-in duration-300" />
            )}
          </button>

          <MushafButton
            variant="ghost"
            onClick={onNextVerse}
            disabled={!currentVerseKey}
            icon={<SkipForward size={26} className="rtl:rotate-180 transition-transform" />}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-transparent hover:bg-primary/10 transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed group text-primary/80 hover:text-primary active:scale-90"
            title={t.mushaf.nextVerse}
          />
        </div>

        {/* Secondary Controls: Repeat + Speed + Advanced */}
        <div className="flex items-center justify-between gap-2">
          {/* Repeat toggle */}
          <MushafButton
            variant="ghost"
            onClick={cycleRepeat}
            icon={<RepeatIcon size={14} className={`shrink-0 ${repeatMode !== "none" ? "animate-spin-slow text-primary" : "text-primary/50"}`} />}
            className={`h-9 px-3 text-[13px] font-bold rounded-full transition-all ${repeatMode === "none" ? "bg-primary/5 text-primary/70 hover:bg-primary/10 hover:text-primary" : "shadow-sm bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15"}`}
          >
            <span className="whitespace-nowrap">
              {repeatMode === "none"
                ? t.mushaf.repeatNone
                : repeatMode === "one"
                  ? t.mushaf.repeatOne
                  : repeatMode === "all"
                    ? t.mushaf.repeatAll
                    : repeatMode === "verse"
                      ? locale === "ar" ? "تكرار آية" : "Repeat Verse"
                      : locale === "ar" ? "المدى" : "Range"}
            </span>
          </MushafButton>

          {/* Speed buttons */}
          <div className="flex items-center gap-1 bg-primary/5 rounded-full p-1 border border-transparent">
            {SPEEDS.map((s) => (
              <MushafButton
                key={s}
                variant="ghost"
                onClick={() => onSetSpeed(s)}
                className={`h-7 px-2.5 text-[11px] font-black tracking-widest rounded-full transition-all ${audioSpeed === s ? "bg-card text-primary shadow-sm border border-primary/10" : "text-primary/50 hover:bg-primary/10 hover:text-primary"}`}
              >
                {s}×
              </MushafButton>
            ))}
          </div>

          {/* Advanced repeat toggle */}
          {(repeatMode === "verse" || repeatMode === "range") && onSetVerseRepeatCount && (
            <MushafButton
              variant="ghost"
              active={showAdvancedRepeat}
              onClick={() => setShowAdvancedRepeat(!showAdvancedRepeat)}
              icon={showAdvancedRepeat ? <ChevronUp size={16} /> : <Settings2 size={16} />}
              className={`h-9 w-9 p-0 flex items-center justify-center rounded-full transition-all ${showAdvancedRepeat ? "bg-primary/10 text-primary shadow-inner" : "bg-primary/5 text-primary/70 hover:bg-primary/10 hover:text-primary"}`}
              title={locale === "ar" ? "إعدادات التكرار المتقدمة" : "Advanced repeat settings"}
            />
          )}
        </div>

        {/* Advanced Repeat Settings for Self-Memorization */}
        <AnimatePresence>
          {showAdvancedRepeat && (repeatMode === "verse" || repeatMode === "range") && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden border-t border-border pt-3"
            >
              {/* Verse Repeat Count */}
              {repeatMode === "verse" && onSetVerseRepeatCount && (
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-primary/50 uppercase tracking-widest flex items-center gap-2 mb-2 px-1">
                    <Repeat size={12} />
                    {locale === "ar" ? "تكرار كل آية" : "Repeat each verse"} ({locale === "ar" ? "مرات" : "times"})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 5, 10].map((count) => (
                      <MushafButton
                        key={count}
                        variant="ghost"
                        onClick={() => onSetVerseRepeatCount(count)}
                        className={`h-8 px-3 text-[13px] font-bold rounded-full transition-all ${verseRepeatCount === count ? "bg-primary/10 text-primary shadow-sm border border-primary/20" : "bg-primary/5 text-primary/60 hover:bg-primary/10 hover:text-primary border border-transparent"}`}
                      >
                        {count}x
                      </MushafButton>
                    ))}
                  </div>
                </div>
              )}

              {/* Range Repeat Count */}
              {repeatMode === "range" && onSetRangeRepeatCount && (
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-primary/50 uppercase tracking-widest flex items-center gap-2 mb-2 px-1">
                    <Repeat size={12} />
                    {locale === "ar" ? "تكرار المدى" : "Repeat range"} ({locale === "ar" ? "مرات" : "times"})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 5, 10].map((count) => (
                      <MushafButton
                        key={count}
                        variant="ghost"
                        onClick={() => onSetRangeRepeatCount(count)}
                        className={`h-8 px-3 text-[13px] font-bold rounded-full transition-all ${rangeRepeatCount === count ? "bg-primary/10 text-primary shadow-sm border border-primary/20" : "bg-primary/5 text-primary/60 hover:bg-primary/10 hover:text-primary border border-transparent"}`}
                      >
                        {count}x
                      </MushafButton>
                    ))}
                  </div>
                </div>
              )}

              {/* Pause Between Verses */}
              {onSetPauseBetweenVerses && (
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-primary/50 uppercase tracking-widest flex items-center gap-2 mb-2 px-1">
                    <Timer size={12} />
                    {locale === "ar" ? "وقفة بين الآيات" : "Pause between verses"} ({locale === "ar" ? "ثانية" : "sec"})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 5].map((seconds) => (
                      <MushafButton
                        key={seconds}
                        variant="ghost"
                        onClick={() => onSetPauseBetweenVerses(seconds)}
                        className={`h-8 px-3 text-[13px] font-bold rounded-full transition-all ${pauseBetweenVerses === seconds ? "bg-primary/10 text-primary shadow-sm border border-primary/20" : "bg-primary/5 text-primary/60 hover:bg-primary/10 hover:text-primary border border-transparent"}`}
                      >
                        {seconds === 0 ? (locale === "ar" ? "بدون" : "None") : `${seconds}s`}
                      </MushafButton>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume */}
        <div className="flex items-center gap-2.5">
          {/* Volume icon */}
          <MushafButton
            variant="ghost"
            onClick={() => onSetVolume(audioVolume > 0 ? 0 : 1)}
            icon={<VolumeIcon size={16} className="text-primary/70" />}
            className="w-8 h-8 flex items-center justify-center p-0 rounded-lg hover:bg-primary/10"
            title={t.mushaf.volume}
          />
          {/* Volume slider */}
          <div className="relative flex-1 h-2 bg-primary/10 rounded-full cursor-pointer group flex items-center"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = isRtl
                ? rect.right - e.clientX
                : e.clientX - rect.left;
              onSetVolume(Math.max(0, Math.min(1, clickX / rect.width)));
            }}
          >
            <div
              className="absolute inset-y-0 start-0 bg-primary/60 group-hover:bg-primary rounded-full transition-colors"
              style={{ width: `${audioVolume * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-black text-primary/50 w-7 text-end tabular-nums tracking-widest">
            {Math.round(audioVolume * 100)}%
          </span>
        </div>

      </div>
    </FloatingPanel>
  );
}
