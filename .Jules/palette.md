## 2024-05-19 - Accessible Icon Buttons
**Learning:** Found that custom reusable UI components like `MushafButton` and `MushafCloseButton` lacked automatic fallback support for `aria-label` when only a `title` was provided.
**Action:** Always ensure that core UI components automatically fallback to `title` for `aria-label` to provide implicit accessibility support for screen readers.
