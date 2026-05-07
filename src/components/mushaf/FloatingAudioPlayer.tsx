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

  const progressPercent = Math.max(
    0,
    Math.min(
      100,
      audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0,
    ),
  );

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
      <div
        data-testid="mushaf-audio-panel"
        className="flex flex-col gap-5 p-5"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Top: Reciter Selection (Engraved Pill) */}
        <div className="mushaf-engraved-container flex items-center rounded-2xl transition-all focus-within:shadow-[inset_0_4px_8px_-2px_rgba(0,0,0,0.15)] focus-within:border-primary/40 relative">
          <div className="px-4 flex items-center justify-center text-primary/40">
            <Music2 size={16} />
          </div>
          <select
            value={selectedReciter}
            onChange={(e) => onSetReciter(Number(e.target.value))}
            className="w-full bg-transparent border-none outline-none text-[14px] font-bold text-primary/90 hover:text-primary transition-colors cursor-pointer appearance-none py-3.5 pr-8 pl-2 rtl:pr-2 rtl:pl-8"
            dir={isRtl ? "rtl" : "ltr"}
          >
            {RECITERS.map((r) => (
              <option
                key={r.id}
                value={r.id}
                className="bg-card text-foreground font-bold py-2"
              >
                {isRtl ? `${r.name}` : `${r.nameEn}`}
              </option>
            ))}
          </select>
          <div
            className={`absolute pointer-events-none flex items-center justify-center p-3 text-primary/50 ${isRtl ? "left-2" : "right-2"}`}
          >
            <ChevronDown size={16} />
          </div>
        </div>

        {/* Middle: Now Playing & Progress Glass Card */}
        <div className="relative flex flex-col pt-8 pb-6 px-5 rounded-[2.5rem] overflow-hidden mushaf-engraved-container border border-primary/10 shadow-[inset_0_1px_10px_rgba(var(--color-primary-rgb),0.03)] bg-gradient-to-b from-primary/[0.02] to-primary/5">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] scale-150 rotate-12 pointer-events-none transition-transform duration-1000 group-hover:scale-110">
            <Music2 size={120} />
          </div>

          <div className="flex flex-col items-center justify-center gap-4 relative z-10 min-h-[100px] mb-6">
            {currentVerseKey ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 shadow-sm backdrop-blur-sm">
                  <div
                    className={`w-2 h-2 rounded-full ${isPlaying ? "bg-primary animate-pulse" : "bg-primary/50"}`}
                  />
                  <span
                    className="mushaf-text-meta font-black text-primary tracking-[0.1em]"
                    dir="ltr"
                  >
                    {currentVerseKey}
                  </span>
                </div>
                {currentVerseText && (
                  <p
                    className="text-xl sm:text-2xl text-foreground/90 font-['Amiri',serif] leading-relaxed text-center line-clamp-3 drop-shadow-sm px-2 transition-all"
                    dir="rtl"
                  >
                    {currentVerseText}
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 opacity-40 py-6">
                <Music2 size={32} className="animate-bounce" />
                <p className="text-sm font-bold tracking-wide">
                  {t.mushaf.noVerseSelected}
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar (Integrated inside the card) */}
          <div className="w-full flex flex-col gap-2 relative z-10">
            <div
              className="relative h-3 w-full bg-black/5 dark:bg-white/5 rounded-full cursor-pointer group flex items-center overflow-visible border border-primary/5 shadow-inner"
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
              <div
                className="absolute inset-y-0 start-0 bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="absolute w-4 h-4 bg-white dark:bg-primary shadow-[0_2px_10px_rgba(var(--color-primary-rgb),0.5)] rounded-full opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200"
                style={{
                  [isRtl ? "right" : "left"]: `calc(${progressPercent}% - 8px)`,
                }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-black text-primary/50 tabular-nums px-1 tracking-widest">
              <span>{formatTime(audioCurrentTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
          </div>
        </div>

        {/* Console: Primary Controls */}
        <div className="flex items-center justify-center gap-5 sm:gap-8 pt-2">
          <MushafButton
            variant="ghost"
            onClick={onPrevVerse}
            disabled={!currentVerseKey}
            className="w-14 h-14 rounded-full disabled:opacity-20 flex-shrink-0"
            icon={<SkipBack size={24} className="rtl:rotate-180" />}
            aria-label={t.mushaf.prevVerse}
          />

          <button
            onClick={isPlaying ? onPause : onPlay}
            className="w-20 h-20 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-[0_10px_30px_-10px_rgba(var(--color-primary-rgb),0.8),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[0_15px_35px_-10px_rgba(var(--color-primary-rgb),0.9),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:translate-y-0.5 active:scale-95 transition-all duration-300 outline-none"
            title={isPlaying ? t.mushaf.pause : t.mushaf.audio}
            aria-label={isPlaying ? t.mushaf.pause : t.mushaf.audio}
          >
            {isPlaying ? (
              <Pause
                size={34}
                fill="currentColor"
                className="animate-in fade-in zoom-in duration-300"
              />
            ) : (
              <Play
                size={34}
                fill="currentColor"
                className="translate-x-1 animate-in fade-in zoom-in duration-300"
              />
            )}
          </button>

          <MushafButton
            variant="ghost"
            onClick={onNextVerse}
            disabled={!currentVerseKey}
            className="w-14 h-14 rounded-full disabled:opacity-20 flex-shrink-0"
            icon={<SkipForward size={24} className="rtl:rotate-180" />}
            aria-label={t.mushaf.nextVerse}
          />
        </div>

        {/* Toolbar: Secondary Controls */}
        <div className="mushaf-engraved-container p-2 rounded-2xl flex items-center justify-between gap-1 shadow-sm mt-2">
          {/* Repeat Button */}
          <MushafButton
            variant={repeatMode !== "none" ? "primary" : "ghost"}
            active={repeatMode !== "none"}
            onClick={cycleRepeat}
            className={`min-w-10 h-10 px-3 py-0 rounded-xl flex items-center justify-center transition-all ${repeatMode !== "none" ? "shadow-md" : ""}`}
            title="Toggle Repeat Mode"
            aria-label={t.mushaf.repeatMode}
          >
            <RepeatIcon
              size={16}
              className={repeatMode !== "none" ? "animate-spin-slow" : ""}
            />
            {repeatMode !== "none" && (
              <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase ml-1.5 rtl:ml-0 rtl:mr-1.5">
                {repeatMode === "one"
                  ? "ONE"
                  : repeatMode === "all"
                    ? "ALL"
                    : repeatMode === "verse"
                      ? "VERSE"
                      : "RANGE"}
              </span>
            )}
          </MushafButton>

          <div className="w-px h-6 bg-primary/10 mx-1" />

          {/* Speed Toggle */}
          <MushafButton
            variant="ghost"
            onClick={() => {
              const currentIndex = SPEEDS.indexOf(audioSpeed);
              const nextIndex = (currentIndex + 1) % SPEEDS.length;
              onSetSpeed(SPEEDS[nextIndex]);
            }}
            className="min-w-10 h-10 px-3 py-0 rounded-xl font-black text-sm tracking-widest text-primary/80"
            title="Audio Speed"
            aria-label={t.mushaf.playbackSpeed}
          >
            {audioSpeed}×
          </MushafButton>

          <div className="w-px h-6 bg-primary/10 flex-1 opacity-0" />

          {/* Inline Volume Control */}
          <div className="flex items-center gap-1.5 px-2 group">
            <MushafButton
              variant="icon"
              onClick={() => onSetVolume(audioVolume > 0 ? 0 : 1)}
              icon={
                <VolumeIcon
                  size={16}
                  className="text-primary/70 group-hover:text-primary transition-colors"
                />
              }
              className="w-8 h-8 p-0 rounded-lg"
              aria-label={t.mushaf.volume}
            />
            <div
              className="w-16 sm:w-20 h-2 bg-primary/10 rounded-full cursor-pointer relative overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = isRtl
                  ? rect.right - e.clientX
                  : e.clientX - rect.left;
                onSetVolume(Math.max(0, Math.min(1, clickX / rect.width)));
              }}
            >
              <div
                className="absolute inset-y-0 start-0 bg-primary/70 group-hover:bg-primary transition-all rounded-full"
                style={{ width: `${audioVolume * 100}%` }}
              />
            </div>
          </div>

          {(repeatMode === "verse" || repeatMode === "range") &&
            onSetVerseRepeatCount && (
              <>
                <div className="w-px h-6 bg-primary/10 mx-1" />
                <MushafButton
                  variant={showAdvancedRepeat ? "primary" : "ghost"}
                  active={showAdvancedRepeat}
                  onClick={() => setShowAdvancedRepeat(!showAdvancedRepeat)}
                  icon={
                    showAdvancedRepeat ? (
                      <ChevronUp size={16} />
                    ) : (
                      <Settings2 size={16} />
                    )
                  }
                  className="w-10 h-10 p-0 rounded-xl"
                  aria-label={t.mushaf.repeatMode}
                  aria-expanded={showAdvancedRepeat}
                />
              </>
            )}
        </div>

        {/* Advanced Repeat Settings Expansion */}
        <AnimatePresence>
          {showAdvancedRepeat &&
            (repeatMode === "verse" || repeatMode === "range") && (
              <motion.div
                initial={{ height: 0, opacity: 0, scale: 0.95 }}
                animate={{ height: "auto", opacity: 1, scale: 1 }}
                exit={{ height: 0, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mushaf-engraved-container p-4 rounded-2xl space-y-4 shadow-inner"
              >
                {repeatMode === "verse" && onSetVerseRepeatCount && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-primary/60 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Repeat size={14} className="text-primary/70" />
                      {locale === "ar" ? "تكرار كل آية" : "Repeat each verse"}
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 5, 10].map((count) => (
                        <MushafButton
                          key={count}
                          variant={
                            verseRepeatCount === count ? "primary" : "ghost"
                          }
                          onClick={() => onSetVerseRepeatCount(count)}
                          className={`h-9 px-0 text-xs font-bold rounded-xl flex items-center justify-center ${verseRepeatCount === count ? "shadow-md" : "bg-card/50"}`}
                        >
                          {count}×
                        </MushafButton>
                      ))}
                    </div>
                  </div>
                )}

                {repeatMode === "range" && onSetRangeRepeatCount && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-primary/60 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Repeat size={14} className="text-primary/70" />
                      {locale === "ar" ? "تكرار المدى" : "Repeat range"}
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 5, 10].map((count) => (
                        <MushafButton
                          key={count}
                          variant={
                            rangeRepeatCount === count ? "primary" : "ghost"
                          }
                          onClick={() => onSetRangeRepeatCount(count)}
                          className={`h-9 px-0 text-xs font-bold rounded-xl flex items-center justify-center ${rangeRepeatCount === count ? "shadow-md" : "bg-card/50"}`}
                        >
                          {count}×
                        </MushafButton>
                      ))}
                    </div>
                  </div>
                )}

                {onSetPauseBetweenVerses && (
                  <div className="space-y-3 pt-1 border-t border-primary/10">
                    <label className="text-[11px] font-black text-primary/60 uppercase tracking-widest flex items-center gap-2 px-1 pt-1">
                      <Timer size={14} className="text-primary/70" />
                      {locale === "ar"
                        ? "وقفة بين الآيات"
                        : "Pause between verses"}
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[0, 1, 2, 3, 5].map((seconds) => (
                        <MushafButton
                          key={seconds}
                          variant={
                            pauseBetweenVerses === seconds ? "primary" : "ghost"
                          }
                          onClick={() => onSetPauseBetweenVerses(seconds)}
                          className={`h-9 px-0 text-xs font-bold rounded-xl flex items-center justify-center ${pauseBetweenVerses === seconds ? "shadow-md" : "bg-card/50"}`}
                        >
                          {seconds === 0
                            ? locale === "ar"
                              ? "0"
                              : "0"
                            : `${seconds}s`}
                        </MushafButton>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </FloatingPanel>
  );
}
