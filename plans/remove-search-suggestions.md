# Plan: Merge Surahs into Search Results & Remove Suggestions

## Problem Description
The search functionality currently has two separate sections:
1. **Suggestions**: Shows matching surahs/chapters (lines 901-925)
2. **Results**: Shows matching verses from the Quran (lines 927-961)

The user wants:
- Remove the suggestions section entirely
- Merge surahs into the search results (surahs should appear first with priority)
- Verses should also appear in search results
- Implement fuzzy search (no need for diacritics or exact spelling)
- Highlight the matched words in verses

## Current Implementation Analysis

### State Variables
- `searchSuggestions` (line 69): Stores chapter/surah suggestions
- `searchResults` (lines 65-67): Stores actual verse search results

### Functions
- `getSearchSuggestions()` (lines 413-437): Returns matching chapters/surahs using fuzzy matching
- `handleSearchSurah()` (lines 440-457): Navigates to a surah page
- `handleSearch()` (lines 209-224): Calls the API to search verses
- `normalizeArabic()` (lines 404-410): Normalizes Arabic text (removes diacritics, unifies letters)

### API
- `searchQuran()` (api.ts lines 164-179): Searches the Quran and returns verses with highlighted text
  - Already provides fuzzy search
  - Returns `highlighted` field with matched words highlighted

## Changes Required

### 1. Create a Unified Search Result Type
Add a new type that can handle both surahs and verses:
```typescript
type UnifiedSearchResult =
  | { type: 'surah'; chapter: Chapter }
  | { type: 'verse'; verse_key: string; text: string; highlighted: string };
```

### 2. Update State Variable
**Location**: Line 65-67
```typescript
// Change from:
const [searchResults, setSearchResults] = useState<
  Array<{ verse_key: string; text: string; highlighted: string }>
>([]);

// To:
const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
```

### 3. Remove State Variable
**Location**: Line 69
```typescript
// Remove this line:
const [searchSuggestions, setSearchSuggestions] = useState<Chapter[]>([]);
```

### 4. Update handleSearch Function
**Location**: Lines 209-224
```typescript
// Modify to include both surahs and verses in results:
const handleSearch = useCallback(async (queryOverride?: string) => {
  const query = (queryOverride || searchQuery).trim();
  if (!query) {
    setSearchResults([]);
    return;
  }
  setSearchLoading(true);
  try {
    // Get surah matches
    const surahMatches = getSearchSuggestions(query);

    // Get verse matches from API
    const data = await searchQuran(query, locale === "ar" ? "ar" : "en");

    // Combine results: surahs first, then verses
    const combinedResults: UnifiedSearchResult[] = [
      ...surahMatches.map(chapter => ({ type: 'surah' as const, chapter })),
      ...data.search.results.map(result => ({
        type: 'verse' as const,
        verse_key: result.verse_key,
        text: result.text,
        highlighted: result.highlighted
      }))
    ];

    setSearchResults(combinedResults);
  } catch {
    setSearchResults([]);
  } finally {
    setSearchLoading(false);
  }
}, [searchQuery, locale]);
```

### 5. Remove handleSearchSurah Function
**Location**: Lines 440-457
```typescript
// Remove the entire handleSearchSurah function
```

### 6. Remove Suggestions Section from UI
**Location**: Lines 901-925
```typescript
// Remove the entire suggestions section:
{/* Search Suggestions */}
{searchSuggestions.length > 0 && (
  // ... entire section
)}
```

### 7. Remove Search Surah Button
**Location**: Lines 889-895
```typescript
// Remove the "Search Surah" button
```

### 8. Remove Suggestions Update from Input onChange
**Location**: Lines 879-882
```typescript
// Remove the setSearchSuggestions call:
onChange={(e) => {
  setSearchQuery(e.target.value);
  // Remove: setSearchSuggestions(getSearchSuggestions(e.target.value));
}}
```

### 9. Update Search Results UI to Handle Both Types
**Location**: Lines 932-954
```typescript
// Update to render both surahs and verses:
{searchResults.map((result) => {
  if (result.type === 'surah') {
    // Render surah result
    return (
      <button
        key={`surah-${result.chapter.id}`}
        className="w-full text-start p-4 hover:bg-muted/50 transition-colors border-b border-border/50"
        onClick={() => {
          const page = SURAH_PAGES[result.chapter.id];
          if (page) goToPage(page);
          setShowSearch(false);
        }}
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg text-xs font-medium text-primary">
            {result.chapter.id}
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium font-['Amiri',serif]">
              {locale === "ar" ? result.chapter.name_arabic : result.chapter.name_simple}
            </p>
            <p className="text-xs text-muted-foreground">
              {result.chapter.translated_name.name} - {result.chapter.verses_count} {locale === "ar" ? "آية" : "verses"}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {t.mushaf.page} {SURAH_PAGES[result.chapter.id]}
          </span>
        </div>
      </button>
    );
  } else {
    // Render verse result
    return (
      <button
        key={result.verse_key}
        className="w-full text-start p-4 hover:bg-muted/50 transition-colors"
        onClick={() => {
          const [surahId] = result.verse_key.split(":").map(Number);
          const page = SURAH_PAGES[surahId];
          if (page) goToPage(page);
          setShowSearch(false);
        }}
      >
        <p className="text-xs text-muted-foreground mb-1">
          {result.verse_key}
        </p>
        <p
          className="text-sm font-['Amiri',serif] leading-relaxed"
          dir="rtl"
          dangerouslySetInnerHTML={{ __html: result.highlighted || result.text }}
        />
      </button>
    );
  }
})}
```

### 10. Update Empty State Message
**Location**: Lines 956-960
```typescript
// Update to say "results" instead of just "no results":
<p className="text-center text-muted-foreground text-sm p-8">
  {locale === "ar" ? "لا توجد نتائج" : "No results"}
</p>
```

## Expected Outcome

After these changes:
1. The search modal will display a unified list of results
2. Surahs will appear first in the results (with priority)
3. Verses will appear after surahs
4. No separate "Suggestions" section
5. The search will be fuzzy (no need for diacritics or exact spelling)
6. Matched words in verses will be highlighted (already provided by the API)

## Files to Modify

- `src/components/mushaf/MushafViewer.tsx`

## Testing Checklist

- [ ] Search for a surah name (e.g., "الفاتحة") - should show surah first, then verses
- [ ] Search for a word (e.g., "الرحمن") - should show matching surahs and verses
- [ ] Search for a surah number (e.g., "1") - should show surah first
- [ ] Verify highlighting works in verse results
- [ ] Verify clicking a surah result navigates to the correct page
- [ ] Verify clicking a verse result navigates to the correct page
- [ ] Empty search query - should show no results
- [ ] No results found - should show "لا توجد نتائج" / "No results"
