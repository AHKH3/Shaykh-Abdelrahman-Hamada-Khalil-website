## 2026-04-29 - Add ARIA Labels to Icon-Only Buttons
**Learning:** In standard icon-only buttons (e.g. Pin, Collapse, Erase), adding `aria-label` using the same text as the `title` property significantly improves screen reader accessibility with no visual regression.
**Action:** Always add `aria-label` to any icon button that lacks visible text.

## 2026-06-07 - MushafButton Accessibility Insights
**Learning:** Found that custom reusable UI elements often lack robust fallback accessibility attributes natively provided by semantic HTML.
**Action:** When building reusable UI elements (e.g., `MushafButton`), map `title` to `aria-label` as a fallback and visual active props to `aria-pressed` to guarantee accessibility for screen readers and semantic ARIA translation.