## 2026-04-29 - Add ARIA Labels to Icon-Only Buttons
**Learning:** In standard icon-only buttons (e.g. Pin, Collapse, Erase), adding `aria-label` using the same text as the `title` property significantly improves screen reader accessibility with no visual regression.
**Action:** Always add `aria-label` to any icon button that lacks visible text.
