# Mini UI Guide

## Scope
- This guide covers visual consistency only.
- No behavior, routing, API, or data-flow changes are allowed from this guide.

## Core Tokens
- Source of truth: `src/app/globals.css`.
- Use semantic tokens only:
  - Surfaces: `background`, `card`, `muted`, `border`.
  - Text: `foreground`, `muted-foreground`.
  - Brand: `primary`, `secondary`, `accent`.
  - States: `destructive`, `warning`, `success`, `info`.
- Avoid direct palette classes (for example `text-red-500`, `bg-blue-50`).
- Avoid raw hex in TS/TSX files. Keep colors in CSS variables.

## Header Rhythm
- Fixed header height token: `--header-height`.
- Every page with fixed header uses:
  - `pt-[var(--header-height)]`
- Do not use legacy offsets (`pt-16`, `pt-20`).

## Z-Index Scale
- Use shared vars:
  - `--z-header`
  - `--z-floating`
  - `--z-modal`
  - `--z-toast`
  - `--z-context-menu`
  - `--z-overlay-top`
- In classes, use `z-[var(--z-modal)]` / `z-[var(--z-toast)]` / `z-[var(--z-context-menu)]`.
- Avoid arbitrary numeric z-index values.

## Component Language
- Cards:
  - Base: `bg-card border border-border rounded-*`
  - Elevation: `card-elevated` or `card-elevated-sm`
- Buttons:
  - Use `MushafButton` or shared button classes (`btn-anthropic`) with tokenized colors.
- Modals/Overlays:
  - Use `ModalShell` as the visual shell.
  - Keep backdrop and panel styles consistent.
- Toasts:
  - Use semantic variants (`success`, `error`, `info`) bound to tokens.

## RTL/LTR Rules
- Use logical spacing classes (`ms-*`, `me-*`, `start-*`, `end-*`) over `ml-*`/`mr-*`/`left-*`/`right-*` when direction matters.
- Directional icons (back/next arrows) must mirror by locale.
- Keep text alignment and icon translation direction-aware.

## Verification Workflow
1. `npm run ui:guardrails`
2. `npm run ui:contrast:check`
3. `npm run visual:test`

## Baseline Update Workflow
1. `npm run visual:update`
2. Review diffs in `tests/visual/ui-regression.spec.ts-snapshots`.
3. Re-run `npm run visual:test` to confirm clean pass.
