# Plan: Convert QuickVerseRangePanel from Side Panel to Centered Modal

## Overview
Change the verse range selector (`QuickVerseRangePanel`) from a side panel that slides in from the side to a centered modal popup that appears in the middle of the screen.

## Current Implementation Analysis
The current implementation in [`src/components/mushaf/QuickVerseRangePanel.tsx`](src/components/mushaf/QuickVerseRangePanel.tsx):
- Uses a full-height side panel (`h-full`)
- Positioned on the right (RTL) or left (LTR) edge
- Animates by sliding in from the side (`x: "100%"` to `x: 0`)
- Has a maximum width of `max-w-sm`
- Includes a backdrop overlay

## Required Changes

### 1. Positioning Changes (Lines 103-107)
**Current:**
```tsx
className={`fixed top-0 ${
  locale === "ar" ? "right-0" : "left-0"
} h-full w-full max-w-sm bg-card shadow-2xl border-${
  locale === "ar" ? "l" : "r"
} border-border overflow-auto`}
```

**New:**
```tsx
className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card shadow-2xl rounded-xl border border-border overflow-auto max-h-[90vh]"
```

**Changes:**
- Remove RTL/LTR positioning (right/left)
- Center using `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`
- Change `h-full` to `max-h-[90vh]` (90% of viewport height)
- Change `max-w-sm` to `max-w-md` (slightly wider for better content fit)
- Add `rounded-xl` for modal appearance
- Remove directional border (border-l or border-r), use `border` instead

### 2. Animation Changes (Lines 99-101)
**Current:**
```tsx
initial={{ x: locale === "ar" ? "100%" : "-100%", opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
exit={{ x: locale === "ar" ? "100%" : "-100%", opacity: 0 }}
```

**New:**
```tsx
initial={{ scale: 0.95, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
exit={{ scale: 0.95, opacity: 0 }}
```

**Changes:**
- Remove x-axis sliding animation
- Use scale-based animation (0.95 to 1)
- Keep opacity fade for smooth transition

### 3. No Other Changes Needed
All functionality remains exactly the same:
- Surah selection dropdown ✓
- Verse range inputs ✓
- Quick selection buttons ✓
- Whole surah button ✓
- Error messages ✓
- Submit/cancel buttons ✓
- All state management ✓
- All validation logic ✓

## Implementation Steps

1. Modify the positioning className in the motion.div (lines 103-107)
2. Update the animation properties (lines 99-101)
3. Test the modal appearance and animations
4. Ensure RTL/LTR layouts still work correctly

## Expected Result
- Modal appears centered on screen
- Smooth scale/fade animation
- Responsive sizing (max 90% viewport height)
- All existing functionality preserved
- No changes to user experience other than positioning

## Files to Modify
- [`src/components/mushaf/QuickVerseRangePanel.tsx`](src/components/mushaf/QuickVerseRangePanel.tsx) - Only file requiring changes
