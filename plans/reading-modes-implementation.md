# Reading Modes Implementation Plan

## Overview
Implement 6 reading modes for the Mushaf (Quran viewer) that are context-aware based on the site's theme:
- 3 light modes (shown when site is in light theme)
- 3 dark modes (shown when site is in dark theme)

## Current State
- Existing modes: `normal`, `sepia` (not working), `dark`
- Sepia mode exists in code but doesn't work properly

## New Reading Modes

### Light Modes (3 total) - Shown when site is in light theme

#### 1. Normal Mode (existing) ✓
- **Name:** `normal`
- **Background:** Uses site theme background (`--background`)
- **Text:** Uses site theme foreground (`--foreground`)
- **Description:** Default light mode

#### 2. Sepia Mode (fix existing)
- **Name:** `sepia`
- **Background:** `#f4ecd8` (light beige/cream)
- **Text:** `#5c4b37` (warm brown)
- **Description:** Classic sepia/brown reading mode
- **Fix needed:** Currently not working properly

#### 3. Warm Mode (new)
- **Name:** `warm`
- **Background:** `#fff5eb` (warm cream)
- **Text:** `#4a3f35` (warm dark brown)
- **Description:** Warm, comfortable reading mode

### Dark Modes (3 total) - Shown when site is in dark theme

#### 1. Dark Mode (existing) ✓
- **Name:** `dark`
- **Background:** `#1a1a2e` (deep blue-black)
- **Text:** `#eaeaea` (off-white)
- **Description:** Default dark mode

#### 2. Midnight Mode (new)
- **Name:** `midnight`
- **Background:** `#0d1b2a` (very dark blue)
- **Text:** `#e0e1dd` (light gray-blue)
- **Description:** Deep midnight blue reading mode

#### 3. Ocean Mode (new)
- **Name:** `ocean`
- **Background:** `#1b263b` (dark navy)
- **Text:** `#778da9` (muted blue-gray)
- **Description:** Calm ocean blue reading mode

## Implementation Details

### 1. TypeScript Type Updates
**File:** `src/components/mushaf/MushafViewer.tsx`, `src/components/mushaf/DisplaySettings.tsx`

Update the readingMode type from:
```typescript
readingMode: "normal" | "sepia" | "dark"
```

To:
```typescript
readingMode: "normal" | "sepia" | "warm" | "dark" | "midnight" | "ocean"
```

### 2. Add Site Theme Detection
**File:** `src/components/mushaf/DisplaySettings.tsx`

Add a prop to detect the current site theme:

```typescript
interface DisplaySettingsProps {
  // ... existing props
  isSiteDark: boolean; // New prop to detect site theme
}
```

### 3. getReadingModeClass Function Updates
**File:** `src/components/mushaf/MushafViewer.tsx` (lines 111-118)

Update the function to handle all 6 modes:

```typescript
const getReadingModeClass = (mode: string) => {
  switch (mode) {
    case "normal": return "bg-background text-foreground";
    case "sepia": return "bg-[#f4ecd8] text-[#5c4b37]";
    case "warm": return "bg-[#fff5eb] text-[#4a3f35]";
    case "dark": return "bg-[#1a1a2e] text-[#eaeaea]";
    case "midnight": return "bg-[#0d1b2a] text-[#e0e1dd]";
    case "ocean": return "bg-[#1b263b] text-[#778da9]";
    default: return "bg-background text-foreground";
  }
};
```

### 4. Context-Aware Reading Modes Array
**File:** `src/components/mushaf/DisplaySettings.tsx` (lines 63-67)

Replace the static readingModes array with a context-aware version:

```typescript
const readingModes = isSiteDark
  ? [
      { value: "dark" as const, label: locale === "ar" ? "داكن" : "Dark" },
      { value: "midnight" as const, label: locale === "ar" ? "منتصف الليل" : "Midnight" },
      { value: "ocean" as const, label: locale === "ar" ? "محيط" : "Ocean" },
    ]
  : [
      { value: "normal" as const, label: locale === "ar" ? "عادي" : "Normal" },
      { value: "sepia" as const, label: locale === "ar" ? "بني فاتح" : "Sepia" },
      { value: "warm" as const, label: locale === "ar" ? "دافئ" : "Warm" },
    ];
```

### 5. CSS Styles Updates
**File:** `src/app/globals.css` (add after line 500)

Add comprehensive CSS classes for all 6 reading modes:

```css
/* Reading Mode Styles */
.mushaf-reading-mode-normal {
  background-color: var(--background);
  color: var(--foreground);
}

.mushaf-reading-mode-sepia {
  background-color: #f4ecd8;
  color: #5c4b37;
}

.mushaf-reading-mode-warm {
  background-color: #fff5eb;
  color: #4a3f35;
}

.mushaf-reading-mode-dark {
  background-color: #1a1a2e;
  color: #eaeaea;
}

.mushaf-reading-mode-midnight {
  background-color: #0d1b2a;
  color: #e0e1dd;
}

.mushaf-reading-mode-ocean {
  background-color: #1b263b;
  color: #778da9;
}

/* Card styles for each reading mode */
.mushaf-reading-mode-normal .card,
.mushaf-reading-mode-normal .bg-card {
  background-color: var(--card);
  border-color: var(--border);
}

.mushaf-reading-mode-sepia .card,
.mushaf-reading-mode-sepia .bg-card {
  background-color: #faf6e8;
  border-color: #e8e0d0;
}

.mushaf-reading-mode-warm .card,
.mushaf-reading-mode-warm .bg-card {
  background-color: #fffaf5;
  border-color: #f0e6d8;
}

.mushaf-reading-mode-dark .card,
.mushaf-reading-mode-dark .bg-card {
  background-color: #16213e;
  border-color: #0f3460;
}

.mushaf-reading-mode-midnight .card,
.mushaf-reading-mode-midnight .bg-card {
  background-color: #1b263b;
  border-color: #415a77;
}

.mushaf-reading-mode-ocean .card,
.mushaf-reading-mode-ocean .bg-card {
  background-color: #253649;
  border-color: #415a77;
}

/* Muted foreground colors for each mode */
.mushaf-reading-mode-sepia .text-muted-foreground {
  color: #8b7355;
}

.mushaf-reading-mode-warm .text-muted-foreground {
  color: #6b5d52;
}

.mushaf-reading-mode-dark .text-muted-foreground {
  color: #a0a0b0;
}

.mushaf-reading-mode-midnight .text-muted-foreground {
  color: #a8b2c1;
}

.mushaf-reading-mode-ocean .text-muted-foreground {
  color: #8d99ae;
}

/* Border colors for each mode */
.mushaf-reading-mode-sepia .border-border {
  border-color: #e8e0d0;
}

.mushaf-reading-mode-warm .border-border {
  border-color: #f0e6d8;
}

.mushaf-reading-mode-dark .border-border {
  border-color: #0f3460;
}

.mushaf-reading-mode-midnight .border-border {
  border-color: #415a77;
}

.mushaf-reading-mode-ocean .border-border {
  border-color: #415a77;
}
```

### 6. Translations Updates
**File:** `src/lib/i18n/translations.ts`

Add new translation keys for the new reading modes:

**Arabic (lines 127-132):**
```typescript
readingMode: "وضع القراءة",
sepia: "بني فاتح",
warm: "دافئ",
dark: "داكن",
midnight: "منتصف الليل",
ocean: "محيط",
```

**English (lines 314-320):**
```typescript
readingMode: "Reading Mode",
sepia: "Sepia",
warm: "Warm",
dark: "Dark",
midnight: "Midnight",
ocean: "Ocean",
```

### 7. Pass Site Theme to DisplaySettings
**File:** `src/components/mushaf/MushafViewer.tsx`

Add logic to detect site theme and pass it to DisplaySettings:

```typescript
// Detect site theme
const isSiteDark = document.documentElement.classList.contains('dark');

// Pass to DisplaySettings component
<DisplaySettings
  // ... existing props
  isSiteDark={isSiteDark}
/>
```

## Mode Selection UI

The reading mode selection will display only 3 modes based on site theme:

**When site is in light theme:**
```
┌─────────┬─────────┬─────────┐
│ Normal  │  Sepia  │  Warm   │
└─────────┴─────────┴─────────┘
```

**When site is in dark theme:**
```
┌─────────┬─────────┬─────────┐
│  Dark   │ Midnight │  Ocean  │
└─────────┴─────────┴─────────┘
```

## Color Palette Reference

### Light Modes
| Mode | Background | Text | Card | Border |
|------|------------|------|------|--------|
| Normal | `--background` (#faf9f5) | `--foreground` (#141413) | `--card` (#ffffff) | `--border` (#d8d5cb) |
| Sepia | #f4ecd8 | #5c4b37 | #faf6e8 | #e8e0d0 |
| Warm | #fff5eb | #4a3f35 | #fffaf5 | #f0e6d8 |

### Dark Modes
| Mode | Background | Text | Card | Border |
|------|------------|------|------|--------|
| Dark | #1a1a2e | #eaeaea | #16213e | #0f3460 |
| Midnight | #0d1b2a | #e0e1dd | #1b263b | #415a77 |
| Ocean | #1b263b | #778da9 | #253649 | #415a77 |

## Testing Checklist

After implementation, verify:
- [ ] When site is in light theme, only 3 light modes are shown
- [ ] When site is in dark theme, only 3 dark modes are shown
- [ ] Normal mode works correctly in light site theme
- [ ] Sepia mode now works (previously broken)
- [ ] Warm mode displays correctly
- [ ] Dark mode works correctly in dark site theme
- [ ] Midnight mode displays correctly
- [ ] Ocean mode displays correctly
- [ ] Card backgrounds and borders are correct for each mode
- [ ] Text colors are readable in all modes
- [ ] Muted foreground colors are appropriate
- [ ] Translations display correctly in Arabic and English
- [ ] Mode switching is smooth with transitions
- [ ] Site theme changes update the available reading modes

## Notes

1. Reading modes are context-aware based on site theme
2. Light site theme shows only light reading modes
3. Dark site theme shows only dark reading modes
4. Each reading mode has its own complete color scheme
5. The sepia mode fix involves ensuring the CSS classes are properly applied
6. All modes should maintain good contrast ratios for readability
7. The implementation maintains backward compatibility with existing code
