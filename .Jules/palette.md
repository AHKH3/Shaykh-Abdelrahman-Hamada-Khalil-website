## 2026-06-07 - MushafButton Accessibility Insights
**Learning:** Found that custom reusable UI elements often lack robust fallback accessibility attributes natively provided by semantic HTML.
**Action:** When building reusable UI elements (e.g., `MushafButton`), map `title` to `aria-label` as a fallback and visual active props to `aria-pressed` to guarantee accessibility for screen readers and semantic ARIA translation.
