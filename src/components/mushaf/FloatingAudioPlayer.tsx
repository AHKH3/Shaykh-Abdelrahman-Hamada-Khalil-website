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
      <div className="p-4 space-y-3" dir={isRtl ? "rtl" : "ltr"}>

        {/* Now Playing Card */}
        <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent backdrop-blur-xl p-5 min-h-[90px] flex flex-col justify-center gap-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative overflow-hidden group/card">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/card:opacity-20 transition-opacity">
            <Music2 size={40} className="text-primary" />
          </div>
          {currentVerseKey ? (
            <>
              <div className="flex items-center gap-2.5 relative z-10">
                <span className="text-[10px] font-black text-primary/70 uppercase tracking-[0.2em]">
                  {t.mushaf.nowPlaying}
                </span>
                <span
                  className="text-[10px] font-bold text-white bg-primary px-3 py-0.5 rounded-full shadow-lg shadow-primary/20"
                  dir="ltr"
                >
                  {currentVerseKey}
                </span>
              </div>
              {currentVerseText && (
                <p
                  className="text-xl text-foreground font-['Amiri',serif] leading-relaxed line-clamp-2 relative z-10 drop-shadow-sm"
                  dir="rtl"
                >
                  {currentVerseText}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground/60 text-center flex items-center justify-center gap-3 italic py-4">
              <Music2 size={20} className="opacity-40 animate-pulse text-primary" />
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
          <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums" dir="ltr">
            <span>{formatTime(audioCurrentTime)}</span>
            <span>{formatTime(audioDuration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6 py-2">
          <MushafButton
            variant="icon"
            onClick={isRtl ? onNextVerse : onPrevVerse}
            disabled={!currentVerseKey}
            icon={<SkipBack size={22} className="group-active:scale-90 transition-transform" />}
            className="p-3 bg-transparent hover:bg-primary/10 transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed group"
            title={isRtl ? t.mushaf.nextVerse : t.mushaf.prevVerse}
          />

          <MushafButton
            variant={isPlaying ? "ghost" : "primary"}
            onClick={isPlaying ? onPause : onPlay}
            className={`w-14 h-14 flex items-center justify-center rounded-2xl shadow-[0_10px_25px_-5px_rgba(var(--color-primary-rgb),0.4)] hover:shadow-[0_15px_30px_-5px_rgba(var(--color-primary-rgb),0.5)] transition-all duration-300 active:scale-95 ${isPlaying ? "bg-primary text-white ring-4 ring-primary/20 hover:bg-primary hover:text-white" : "bg-primary text-white"}`}
            title={isPlaying ? t.mushaf.pause : t.mushaf.audio}
            icon={isPlaying ? (
              <Pause size={28} fill="currentColor" className="animate-in fade-in zoom-in duration-300" />
            ) : (
              <Play size={28} fill="currentColor" className="translate-x-0.5 animate-in fade-in zoom-in duration-300" />
            )}
          />

          <MushafButton
            variant="icon"
            onClick={isRtl ? onPrevVerse : onNextVerse}
            disabled={!currentVerseKey}
            icon={<SkipForward size={22} className="group-active:scale-90 transition-transform" />}
            className="p-3 bg-transparent hover:bg-primary/10 transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed group"
            title={isRtl ? t.mushaf.prevVerse : t.mushaf.nextVerse}
          />
        </div>

        {/* Secondary Controls: Repeat + Speed + Advanced */}
        <div className="flex items-center justify-between gap-2">
          {/* Repeat toggle */}
          <MushafButton
            variant={repeatMode !== "none" ? "primary" : "ghost"}
            onClick={cycleRepeat}
            icon={<RepeatIcon size={14} className={repeatMode !== "none" ? "animate-spin-slow" : ""} />}
            className={`px-3 py-2 text-xs font-bold whitespace-nowrap flex-shrink-0 ${repeatMode === "none" ? "bg-muted/50 text-muted-foreground hover:bg-muted" : "shadow-lg shadow-primary/20"}`}
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
          <div className="flex items-center gap-1 bg-muted/40 backdrop-blur-sm rounded-xl p-1 border border-border/30">
            {SPEEDS.map((s) => (
              <MushafButton
                key={s}
                variant="ghost"
                onClick={() => onSetSpeed(s)}
                className={`px-2.5 py-1 text-[10px] font-black ${audioSpeed === s ? "bg-background text-primary shadow-sm ring-1 ring-border/50 hover:bg-background hover:text-primary" : "text-muted-foreground/70 hover:bg-background/50"}`}
              >
                {s}×
              </MushafButton>
            ))}
          </div>

          {/* Advanced repeat toggle */}
          {(repeatMode === "verse" || repeatMode === "range") && onSetVerseRepeatCount && (
            <MushafButton
              variant="icon"
              active={showAdvancedRepeat}
              onClick={() => setShowAdvancedRepeat(!showAdvancedRepeat)}
              icon={showAdvancedRepeat ? <ChevronUp size={14} /> : <Settings2 size={14} />}
              className="p-1.5"
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
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Repeat size={12} />
                    {locale === "ar" ? "تكرار كل آية" : "Repeat each verse"} ({locale === "ar" ? "مرات" : "times"})
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5, 10].map((count) => (
                      <MushafButton
                        key={count}
                        variant={verseRepeatCount === count ? "primary" : "ghost"}
                        onClick={() => onSetVerseRepeatCount(count)}
                        className={`flex-1 px-2 py-1.5 text-xs border ${verseRepeatCount === count ? "" : "bg-muted hover:bg-muted/80 border-border"}`}
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
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Repeat size={12} />
                    {locale === "ar" ? "تكرار المدى" : "Repeat range"} ({locale === "ar" ? "مرات" : "times"})
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5, 10].map((count) => (
                      <MushafButton
                        key={count}
                        variant={rangeRepeatCount === count ? "primary" : "ghost"}
                        onClick={() => onSetRangeRepeatCount(count)}
                        className={`flex-1 px-2 py-1.5 text-xs border ${rangeRepeatCount === count ? "" : "bg-muted hover:bg-muted/80 border-border"}`}
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
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Timer size={12} />
                    {locale === "ar" ? "وقفة بين الآيات" : "Pause between verses"} ({locale === "ar" ? "ثانية" : "sec"})
                  </label>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 5].map((seconds) => (
                      <MushafButton
                        key={seconds}
                        variant={pauseBetweenVerses === seconds ? "primary" : "ghost"}
                        onClick={() => onSetPauseBetweenVerses(seconds)}
                        className={`flex-1 px-2 py-1.5 text-xs border ${pauseBetweenVerses === seconds ? "" : "bg-muted hover:bg-muted/80 border-border"}`}
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
          <MushafButton
            variant="icon"
            onClick={() => onSetVolume(audioVolume > 0 ? 0 : 1)}
            icon={<VolumeIcon size={16} />}
            className="flex-shrink-0"
            title={t.mushaf.volume}
          />
          <div className="relative flex-1 h-1.5 bg-muted rounded-full cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = isRtl
                ? rect.right - e.clientX
                : e.clientX - rect.left;
              onSetVolume(Math.max(0, Math.min(1, clickX / rect.width)));
            }}
          >
            <div
              className="absolute inset-y-0 start-0 bg-muted-foreground/60 group-hover:bg-primary rounded-full transition-colors"
              style={{ width: `${audioVolume * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums w-7 text-end">
            {Math.round(audioVolume * 100)}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Reciter Selector */}
        <div>
          <label className="block text-[10px] font-black text-muted-foreground/60 mb-2 uppercase tracking-widest px-1">
            {t.mushaf.selectReciter}
          </label>
          <div className="relative group">
            <select
              value={selectedReciter}
              onChange={(e) => onSetReciter(Number(e.target.value))}
              className="w-full bg-muted/30 backdrop-blur-md border border-border/40 hover:border-primary/40 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 pe-10 font-medium cursor-pointer"
              dir={isRtl ? "rtl" : "ltr"}
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id} className="bg-card">
                  {isRtl ? `${r.name} — ${r.style}` : `${r.nameEn} — ${r.styleEn}`}
                </option>
              ))}
            </select>
            <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:scale-110 ${isRtl ? "left-3" : "right-3"}`}>
              <ChevronDown size={14} className="text-primary/60" />
            </div>
          </div>
        </div>
      </div>
    </FloatingPanel>
  );
}
