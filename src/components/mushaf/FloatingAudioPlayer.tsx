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
  audioProgress: number; // 0-100
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
  audioProgress,
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

  const currentReciter = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];
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

  const progressPercent = audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0;

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
        <div className="rounded-xl border border-border bg-muted/30 p-3 min-h-[64px] flex flex-col justify-center gap-1">
          {currentVerseKey ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {t.mushaf.nowPlaying}
                </span>
                <span
                  className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full"
                  dir="ltr"
                >
                  {currentVerseKey}
                </span>
              </div>
              {currentVerseText && (
                <p
                  className="text-sm text-foreground font-['Amiri',serif] leading-relaxed line-clamp-2"
                  dir="rtl"
                >
                  {currentVerseText}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
              <Music2 size={14} className="opacity-50" />
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
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={isRtl ? onNextVerse : onPrevVerse}
            disabled={!currentVerseKey}
            className="p-2 rounded-full text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={isRtl ? t.mushaf.nextVerse : t.mushaf.prevVerse}
          >
            <SkipBack size={19} />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className={`w-12 h-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all ${isPlaying ? "ring-2 ring-primary/30 ring-offset-2 ring-offset-card scale-105" : ""
              }`}
            title={isPlaying ? t.mushaf.pause : t.mushaf.audio}
          >
            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="translate-x-0.5" />}
          </button>

          <button
            onClick={isRtl ? onPrevVerse : onNextVerse}
            disabled={!currentVerseKey}
            className="p-2 rounded-full text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={isRtl ? t.mushaf.prevVerse : t.mushaf.nextVerse}
          >
            <SkipForward size={19} />
          </button>
        </div>

        {/* Secondary Controls: Repeat + Speed + Advanced */}
        <div className="flex items-center justify-between gap-2">
          {/* Repeat toggle */}
          <button
            onClick={cycleRepeat}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${repeatMode !== "none"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            title={
              repeatMode === "none"
                ? t.mushaf.repeatNone
                : repeatMode === "one"
                  ? t.mushaf.repeatOne
                  : repeatMode === "all"
                    ? t.mushaf.repeatAll
                    : repeatMode === "verse"
                      ? locale === "ar" ? "تكرار كل آية" : "Repeat each verse"
                      : locale === "ar" ? "تكرار المدى" : "Repeat range"
            }
          >
            <RepeatIcon size={14} />
            <span>
              {repeatMode === "none"
                ? t.mushaf.repeatNone
                : repeatMode === "one"
                  ? t.mushaf.repeatOne
                  : repeatMode === "all"
                    ? t.mushaf.repeatAll
                    : repeatMode === "verse"
                      ? locale === "ar" ? "كل آية" : "Each verse"
                      : locale === "ar" ? "المدى" : "Range"}
            </span>
          </button>

          {/* Speed buttons */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${audioSpeed === s
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Advanced repeat toggle */}
          {(repeatMode === "verse" || repeatMode === "range") && onSetVerseRepeatCount && (
            <button
              onClick={() => setShowAdvancedRepeat(!showAdvancedRepeat)}
              className={`p-1.5 rounded-lg transition-all ${showAdvancedRepeat
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              title={locale === "ar" ? "إعدادات التكرار المتقدمة" : "Advanced repeat settings"}
            >
              {showAdvancedRepeat ? <ChevronUp size={14} /> : <Settings2 size={14} />}
            </button>
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
                      <button
                        key={count}
                        onClick={() => onSetVerseRepeatCount(count)}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${verseRepeatCount === count
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted hover:bg-muted/80 border-border"
                          }`}
                      >
                        {count}x
                      </button>
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
                      <button
                        key={count}
                        onClick={() => onSetRangeRepeatCount(count)}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${rangeRepeatCount === count
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted hover:bg-muted/80 border-border"
                          }`}
                      >
                        {count}x
                      </button>
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
                      <button
                        key={seconds}
                        onClick={() => onSetPauseBetweenVerses(seconds)}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${pauseBetweenVerses === seconds
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted hover:bg-muted/80 border-border"
                          }`}
                      >
                        {seconds === 0 ? (locale === "ar" ? "بدون" : "None") : `${seconds}s`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onSetVolume(audioVolume > 0 ? 0 : 1)}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            title={t.mushaf.volume}
          >
            <VolumeIcon size={16} />
          </button>
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
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
            {t.mushaf.selectReciter}
          </label>
          <div className="relative">
            <select
              value={selectedReciter}
              onChange={(e) => onSetReciter(Number(e.target.value))}
              className="w-full bg-muted/50 border border-border hover:border-primary/50 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors pe-7"
              dir={isRtl ? "rtl" : "ltr"}
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {isRtl ? `${r.name} — ${r.style}` : `${r.nameEn} — ${r.styleEn}`}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground ${isRtl ? "left-2.5" : "right-2.5"
                }`}
            />
          </div>
        </div>
      </div>
    </FloatingPanel>
  );
}
