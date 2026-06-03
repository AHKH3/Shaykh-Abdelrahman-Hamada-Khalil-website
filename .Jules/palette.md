## 2024-05-14 - FloatingAudioPlayer Play/Pause button missing ARIA label
**Learning:** The play/pause button in FloatingAudioPlayer only had a `title` attribute for tooltip/hover, but lacked an `aria-label` for screen reader accessibility, which is essential for icon-only buttons.
**Action:** Added `aria-label={isPlaying ? t.mushaf.pause : t.mushaf.playPause}` or equivalent translation key to ensure the button is accessible.
