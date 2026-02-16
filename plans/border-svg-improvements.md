# Border SVG Improvements Plan

## Current State Analysis

The script [`scripts/convert_border_svg.py`](scripts/convert_border_svg.py:1) converts an Islamic art border SVG into a React component. Current issues:

1. **Padding is too small**: Currently set to `15` pixels (line 41), which creates minimal space between the border and text
2. **Quality issues**: 
   - Uses `preserveAspectRatio="none"` which can cause distortion
   - No shape rendering optimization
   - Limited bounds detection (only 200 paths)
3. **No flexibility**: Hard-coded padding without ability to adjust spacing dynamically

## Proposed Improvements

### 1. Increase Padding (Primary Request)
- **Change padding from 15 to 50-80 pixels** to create more breathing room between border and text
- This will allow the Quranic text to have proper visual separation from the decorative frame

### 2. Improve Rendering Quality
- Change `preserveAspectRatio="none"` to `preserveAspectRatio="xMidYMid meet"` to maintain aspect ratio
- Add `shapeRendering="geometricPrecision"` attribute for sharper edges
- Add `vectorEffect="non-scaling-stroke"` to maintain stroke width at different sizes
- Consider adding `imageRendering="optimizeQuality"` for better visual output

### 3. Enhance Bounds Detection
- Increase path processing limit from 200 to 500 or more for accurate bounds
- Improve coordinate range filtering (currently -100 to 2100)
- Add better error handling and fallback mechanisms

### 4. Add Flexibility to the React Component
- Add a `padding` prop to `AuthenticFloralFrame` component
- Allow dynamic adjustment of border-to-text spacing
- Default to increased padding but allow customization

### 5. Optimize SVG Processing
- Remove unnecessary elements more aggressively
- Optimize path data where possible
- Add comments for better maintainability

## Implementation Details

### Changes to `scripts/convert_border_svg.py`:

```python
# Line 41: Increase padding
padding = 60  # Changed from 15 to 60

# Line 82: Improve SVG rendering attributes
line = line.replace('<svg', '<svg className="w-full h-full" preserveAspectRatio="xMidYMid meet" shapeRendering="geometricPrecision"')

# Line 34: Increase path limit
if path_count > 500:  # Changed from 200 to 500
    break
```

### Changes to generated `AuthenticFloralFrame.tsx`:

Add `fontSize` and `pageWidth` props to calculate dynamic padding:

```tsx
interface AuthenticFloralFrameProps {
  color: string;
  fontSize?: number;      // Font size in pixels (e.g., 32, 40, 48)
  pageWidth?: "normal" | "wide" | "full";  // Page width mode
}

export default function AuthenticFloralFrame({ 
  color, 
  fontSize = 32,
  pageWidth = "normal" 
}: AuthenticFloralFrameProps) {
  // Calculate dynamic padding based on font size and page width
  const calculatePadding = () => {
    // Base padding scales with font size (approximately 1.5x to 2x font size)
    const basePadding = Math.round(fontSize * 1.8);
    
    // Adjust based on page width
    const widthMultiplier = pageWidth === "full" ? 1.5 : 
                           pageWidth === "wide" ? 1.3 : 1.0;
    
    return Math.round(basePadding * widthMultiplier);
  };

  const padding = calculatePadding();

  return (
    <div 
      className="absolute w-full h-full pointer-events-none select-none"
      style={{ inset: `${padding}px` }}
    >
      <svg ...>
        {/* SVG content */}
      </svg>
    </div>
  );
}
```

### Dynamic Padding Formula:

- **Base padding**: `fontSize × 1.8` (e.g., 32px font → ~58px padding)
- **Page width multiplier**:
  - Normal: 1.0x
  - Wide: 1.3x
  - Full: 1.5x

This ensures proportional spacing that adjusts automatically.

### Update MushafFrame.tsx to pass dynamic props:

```tsx
interface MushafFrameProps {
    readingMode: "normal" | "sepia" | "green" | "purple" | "blue" | "red" | "pink" | "highContrast";
    isDark?: boolean;
    fontSize?: number;      // Add font size prop
    pageWidth?: "normal" | "wide" | "full";  // Add page width prop
}

export default function MushafFrame({ 
    readingMode, 
    isDark = false,
    fontSize = 32,
    pageWidth = "normal"
}: MushafFrameProps) {
    // ... color logic ...
    
    return (
        <div className="absolute inset-0 z-0 pointer-events-none select-none rounded-[32px] overflow-hidden">
            <AuthenticFloralFrame 
                color={color} 
                fontSize={fontSize}
                pageWidth={pageWidth}
            />
        </div>
    );
}
```

### Update MushafViewer.tsx to pass fontSize and pageWidth:

The MushafViewer already has `fontSize` and `pageWidth` state variables (lines 85-86). Simply pass them to MushafFrame:

```tsx
<MushafFrame 
    readingMode={readingMode} 
    isDark={theme === "dark"}
    fontSize={fontSize}
    pageWidth={pageWidth}
/>
```

## Expected Results

1. **More breathing room**: Text will have 60px (or more) of space from the decorative border
2. **Better quality**: Crisper edges, no distortion, proper aspect ratio
3. **Flexibility**: Can adjust padding per use case if needed
4. **Improved readability**: Better visual hierarchy between frame and content

## Testing Considerations

After implementation, verify:
- Border appears correctly on all reading modes (normal, sepia, green, etc.)
- Padding works well with different font sizes
- Quality improvements are visible on high-DPI displays
- No layout issues on different screen sizes
- Performance remains acceptable

## Files to Modify

1. `scripts/convert_border_svg.py` - Update padding, rendering attributes, and path limit
2. Regenerate `src/components/mushaf/frames/AuthenticFloralFrame.tsx` by running the updated script
3. Optionally update `src/components/mushaf/MushafFrame.tsx` if we want to expose padding control

## Questions for User

1. What padding value would you prefer? (Recommendation: 60-80 pixels)
2. Should we add a `padding` prop to allow dynamic adjustment, or use a fixed increased value?
3. Any specific quality issues you've noticed that we should address?
