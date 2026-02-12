# Plan: Fix Verse Number Font Size Scaling

## Problem
The verse numbers (رقم الآية) have fixed font sizes (`text-base` or `text-lg`) that do not scale when users change the font size in display settings. The verse text scales correctly using `getFontSizeClass(fontSize)`, but the verse numbers remain at a fixed size.

## Solution
Create a helper function to calculate the appropriate verse number font size based on the current font size setting, then apply this class to all verse number spans.

## Implementation Details

### 1. Create Helper Function for Verse Number Font Size
Add a new helper function `getVerseNumberFontSizeClass(size: number)` that returns the appropriate Tailwind class for verse numbers based on the font size setting.

The mapping should be:
- Font size 24 (text-2xl) → Verse number: `text-lg`
- Font size 32 (text-4xl) → Verse number: `text-xl`
- Font size 40 (text-5xl) → Verse number: `text-2xl`
- Font size 48 (text-6xl) → Verse number: `text-3xl`

This ensures the verse number is proportionally smaller than the verse text but scales with it.

### 2. Update Verse Number Spans in Three Locations

#### Location 1: Double Page Mode - Left Page (Line 631)
**Current code:**
```tsx
<span
  className="inline-flex items-center justify-center text-base text-muted-foreground font-sans mx-1 min-w-[1.5rem] hover:bg-muted/50 rounded cursor-pointer"
  onClick={(e) => handleVerseNumberClick(verse, e)}
>
  ﴿{verse.verse_number.toLocaleString("ar-EG")}﴾
</span>
```

**Change to:**
```tsx
<span
  className={`inline-flex items-center justify-center ${getVerseNumberFontSizeClass(fontSize)} text-muted-foreground font-sans mx-1 min-w-[1.5rem] hover:bg-muted/50 rounded cursor-pointer`}
  onClick={(e) => handleVerseNumberClick(verse, e)}
>
  ﴿{verse.verse_number.toLocaleString("ar-EG")}﴾
</span>
```

#### Location 2: Double Page Mode - Right Page (Line 676)
**Current code:**
```tsx
<span
  className="inline-flex items-center justify-center text-base text-muted-foreground font-sans mx-1 min-w-[1.5rem] hover:bg-muted/50 rounded cursor-pointer"
  onClick={(e) => handleVerseNumberClick(verse, e)}
>
  ﴿{verse.verse_number.toLocaleString("ar-EG")}﴾
</span>
```

**Change to:**
```tsx
<span
  className={`inline-flex items-center justify-center ${getVerseNumberFontSizeClass(fontSize)} text-muted-foreground font-sans mx-1 min-w-[1.5rem] hover:bg-muted/50 rounded cursor-pointer`}
  onClick={(e) => handleVerseNumberClick(verse, e)}
>
  ﴿{verse.verse_number.toLocaleString("ar-EG")}﴾
</span>
```

#### Location 3: Single Page Mode (Line 724)
**Current code:**
```tsx
<span
  className="inline-flex items-center justify-center text-lg text-muted-foreground font-sans mx-1 min-w-[1.5rem] hover:bg-muted/50 rounded cursor-pointer"
  onClick={(e) => handleVerseNumberClick(verse, e)}
>
  ﴿{verse.verse_number.toLocaleString("ar-EG")}﴾
</span>
```

**Change to:**
```tsx
<span
  className={`inline-flex items-center justify-center ${getVerseNumberFontSizeClass(fontSize)} text-muted-foreground font-sans mx-1 min-w-[1.5rem] hover:bg-muted/50 rounded cursor-pointer`}
  onClick={(e) => handleVerseNumberClick(verse, e)}
>
  ﴿{verse.verse_number.toLocaleString("ar-EG")}﴾
</span>
```

## Files to Modify
- `src/components/mushaf/MushafViewer.tsx`

## Testing Checklist
1. Open the Mushaf viewer
2. Open display settings
3. Change font size to each available option (24, 32, 40, 48)
4. Verify that verse numbers scale proportionally with verse text
5. Verify in both single and double page display modes
6. Verify verse number click functionality still works
