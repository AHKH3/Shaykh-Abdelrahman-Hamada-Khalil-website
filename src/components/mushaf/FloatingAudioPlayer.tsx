"use client";

import { Volume2, Play, Pause, SkipBack, SkipForward, ChevronDown } from "lucide-react";
import FloatingPanel from "./FloatingPanel";
import { RECITERS } from "@/lib/quran/api";
import { useI18n } from "@/lib/i18n/context";

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
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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
}: FloatingAudioPlayerProps) {
  const { t, locale } = useI18n();

  const currentReciter = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];

  // Group reciters by name for display
  const reciterGroups: Record<string, typeof RECITERS> = {};
  RECITERS.forEach((r) => {
    const key = r.nameEn.split(" (")[0];
    if (!reciterGroups[key]) reciterGroups[key] = [];
    reciterGroups[key].push(r);
  });

  return (
    <FloatingPanel
      id="audio-player"
      title={locale === "ar" ? t.mushaf.audioPlayer : t.mushaf.audioPlayer}
      icon={<Volume2 size={16} />}
      isOpen={isOpen}
      onClose={onClose}
      minWidth={300}
      defaultPanelHeight={260}
      zIndex={45}
    >
      <div className="p-4 space-y-4">
        {/* Currently Playing */}
        <div className="p-3 bg-muted/50 rounded-xl border border-border min-h-[60px] flex flex-col justify-center">
          {currentVerseKey ? (
            <>
              <p className="text-xs text-muted-foreground mb-1">
                {locale === "ar" ? t.mushaf.nowPlaying : t.mushaf.nowPlaying}
              </p>
              <p className="text-sm font-semibold text-primary" dir="ltr">
                {currentVerseKey}
              </p>
              {currentVerseText && (
                <p
                  className="text-xs text-muted-foreground mt-1 line-clamp-2 font-['Amiri',serif] leading-relaxed"
                  dir="rtl"
                >
                  {currentVerseText}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              {locale === "ar" ? t.mushaf.noVerseSelected : t.mushaf.noVerseSelected}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={audioDuration || 100}
            value={audioCurrentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-1.5 accent-primary cursor-pointer"
            disabled={!currentVerseKey}
          />
          <div className="flex justify-between text-xs text-muted-foreground" dir="ltr">
            <span>{formatTime(audioCurrentTime)}</span>
            <span>{formatTime(audioDuration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onPrevVerse}
            disabled={!currentVerseKey}
            className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-40"
            title={locale === "ar" ? t.mushaf.prevVerse : t.mushaf.prevVerse}
          >
            {locale === "ar" ? <SkipForward size={20} /> : <SkipBack size={20} />}
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className="p-3 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors shadow-md"
            title={isPlaying ? t.mushaf.pause : t.mushaf.audio}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </button>

          <button
            onClick={onNextVerse}
            disabled={!currentVerseKey}
            className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-40"
            title={locale === "ar" ? t.mushaf.nextVerse : t.mushaf.nextVerse}
          >
            {locale === "ar" ? <SkipBack size={20} /> : <SkipForward size={20} />}
          </button>
        </div>

        {/* Reciter Selector */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            {locale === "ar" ? t.mushaf.selectReciter : t.mushaf.selectReciter}
          </label>
          <div className="relative">
            <select
              value={selectedReciter}
              onChange={(e) => onSetReciter(Number(e.target.value))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 pe-8"
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {locale === "ar"
                    ? `${r.name} — ${r.style}`
                    : `${r.nameEn}`}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground ${
                locale === "ar" ? "left-3" : "right-3"
              }`}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {locale === "ar"
              ? `${currentReciter.name} — ${currentReciter.style}`
              : `${currentReciter.nameEn}`}
          </p>
        </div>
      </div>
    </FloatingPanel>
  );
}
