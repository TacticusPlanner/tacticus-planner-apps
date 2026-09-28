## Context

Goal rows/cards reuse status badges and progress visuals; semantic colors come from shared UI tokens in `packages/ui/src/styles/globals.css`. The Goals page (`/plan/goals`) is one priority-ordered list (no Sort) that also hosts reordering: an always-visible drag handle (`goal-row-drag-handle`) on Active/Paused desktop rows, a dimmed row while dragging (`data-dragging`, currently `opacity-60`), a mobile reorder mode with a `MobileReorderBar`, and an `OrderConflictBanner` (destructive `Alert`). If `add-goals-overview-density-option` lands, a Compact presentation must be checked without losing the Actual/Potential explanation.

## Goals / Non-Goals

**Goals:** Measured WCAG 2.2 AA contrast for in-scope rendered states and redundant non-color cues.

**Non-Goals:** Product-wide rebrand or removal of existing status colors. Adding the priority-position number itself: it is specified and built by `consolidate-goals-into-plan-and-remove-active-project` ("In-flight rows show their account-wide priority position", tasks 3.7-3.9); this audit only checks that the number, the order, and the reorder controls are perceivable.

## Decisions

- Audit actual rendered foreground/background pairs in light and dark themes, not token values in isolation. Use 4.5:1 normal text, 3:1 large text, and 3:1 meaningful non-text boundaries/states, per [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/#contrast-minimum) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast).
- Prefer correcting semantic tokens when several Goal components share a failure; use local adjustments only where the background or state is truly specific. Recheck other consumers of any changed shared token.
- Keep status/restriction words or named icons; do not depend on color, and preserve keyboard-reachable progress explanations.
- Reorder affordances are audited as interactive controls: the drag handle needs an accessible name and 3:1 boundary contrast in both themes; a row being dragged must stay legible (the dimming must not push its text below 4.5:1 while it is the drag subject); the conflict banner's message and its Retry/Dismiss actions meet text contrast and are announced (it is `role="alert"`).
- Paused rows in the priority-ordered list keep a text or icon cue, not only muted color, since Paused goals now sit in the same ordered list as Active ones.

## Risks / Trade-offs

- A global token change may alter unrelated pages → audit consumers and screenshot both themes before accepting it.
- Thin progress markers can pass nominal colors yet appear faint → inspect rendered pixel thickness and increase prominence if needed.
- Dimming a dragged row for feedback can fail contrast at rest during the drag → measure the dimmed state and adjust the opacity or use a non-opacity cue if it fails.

## Open Questions

- Which rendered combinations fail today? Record measured pairs in the implementation audit and limit visual edits to those failures; the threshold and required non-color cues are already fixed here.

## Audit results (measured)

Method: `apps/web/src/fsd/pages/goals/ui/shared/goal-contrast-audit.test.ts` parses the OKLCH tokens in `packages/ui/src/styles/globals.css` (`:root` and `.dark`), converts to sRGB, composites translucent layers over the surface they sit on (browser-style sRGB blending) and asserts the WCAG ratio for each rendered pair. Row surfaces: table rows and plain mobile cards have no fill (page `background`); a hovered table row is `muted/50`; reorder cards, the mobile reorder bar and the conflict banner sit on `card`. Run `VITE_AUDIT_PRINT=1 pnpm --filter web exec vitest run src/fsd/pages/goals/ui/shared/goal-contrast-audit.test.ts` to print the full matrix (48 pairs x 2 themes). Density does not change any colour class, so Comfortable and Compact share these values; the priority number is one class (`text-foreground`) in both.

### Failing pairs found (before) and fix

| Pair                                                      | Threshold | Before (light / dark)                                        | After (light / dark)         | Fix                                                                                                                   |
| --------------------------------------------------------- | --------- | ------------------------------------------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `text-muted-foreground` on row / hovered row / muted      | 4.5       | 4.24 / 6.15, 4.20 / 5.67, 4.17 / 5.18                        | 5.04, 5.00, 4.96 / unchanged | light `--muted-foreground` L 0.551 -> 0.51 (token)                                                                    |
| Dragged row (`opacity-60`) `text-foreground`              | 4.5       | 4.16 / 4.73                                                  | 16.32 / 11.94                | replaced opacity by an opaque lifted row: `bg-card`, `outline-ring`, `z-10` (mobile card: `border-ring`, `shadow-lg`) |
| Dragged row (`opacity-60`) muted text                     | 4.5       | 2.18 / 3.13                                                  | 5.75 / 6.93                  | same                                                                                                                  |
| Conflict banner description (`destructive/90`) on card    | 4.5       | 4.30 / 3.91                                                  | 5.03 / 5.27                  | `--destructive` light 0.56 -> 0.52, dark 0.62 -> 0.70 (token)                                                         |
| `text-destructive` on row / `bg-destructive/5` error box  | 4.5       | 4.42 / 4.05, 4.13 / 3.86                                     | 5.24 / 5.56, 4.87 / 5.21     | same token change                                                                                                     |
| Blocked indicator `text-amber-700` on row                 | 4.5       | 4.43 / 3.15 (hover 4.39 / 2.90)                              | 6.25 / 9.27                  | `text-amber-800 dark:text-amber-400` (also goal detail blockers and planning-stale text)                              |
| Ceiling marker `amber-400` vs muted track                 | 3         | 1.48 / 7.81                                                  | 4.35 / 7.81                  | `bg-amber-700 dark:bg-amber-400`                                                                                      |
| Potential stripe (`primary`, `opacity-40`) vs track       | 3         | 1.88 / 1.76                                                  | 4.37 / 3.84                  | `opacity-85`                                                                                                          |
| Legend Potential swatch ring `primary/60` vs row          | 3         | 2.72 / 2.59                                                  | 5.95 / 5.62                  | `ring-primary`                                                                                                        |
| `text-primary` on hovered row (potential %)               | 4.5       | 5.89 / 4.43                                                  | 5.89 / 5.17                  | dark `--primary` L 0.64 -> 0.68 (token)                                                                               |
| Project chip `text-primary` on `bg-primary/10`            | 4.5       | 5.13 / 4.21                                                  | 5.13 / 4.83                  | same token change                                                                                                     |
| Quick-nav chip hover (`hover:bg-accent`, foreground text) | 4.5       | 6.00 / 1.56                                                  | 6.81 / 7.92                  | added `hover:text-accent-foreground`                                                                                  |
| Drag handle keyboard focus                                | 3         | no explicit indicator (UA outline in `ring/50`, 2.26 / 2.20) | 5.95 / 4.81                  | `outline-none focus-visible:ring-[3px] focus-visible:ring-ring`                                                       |

### Passing pairs (unchanged, recorded)

Priority number `text-foreground` (row 14.31 / 10.60, hovered 14.19 / 9.76, card 16.32 / 11.94; it is the same class in Comfortable, Compact and the mobile card/reorder card); drag handle icon (the boundary-defining graphic) 5.04 / 6.15 on row, 5.75 / 6.93 on card, 4.96 / 5.18 on hover; conflict banner title 5.98 / 6.26, Retry/Dismiss 14.31 / 11.94 and 16.32 / 11.94; reorder bar hint and Done button (6.78 / 5.76); Active/Paused/Completed/Archived/Restricted badges >= 6.78; actual progress fill vs track 5.84 / 4.73; quick-nav chip text and Create project button 14.31 / 10.60; focus borders/rings 5.95 / 4.81; tooltip ceiling-reason text at 75% 8.58 / 5.53.

Interpretation: the drag handle has no drawn border, so its "boundary" is the grip icon; it is measured against every surface it can sit on (>= 3:1 everywhere, >= 4.9:1 in practice). The 1px `border` of the chips/cards is decorative (their text or icon carries identification) and is not held to 3:1.

### Shared token consumers

Changed tokens: light `--muted-foreground` (darker: only raises contrast for its many text consumers), `--destructive` light darker / dark lighter (used as text, tint and a few solid fills: the Userjot dot, raid HP bars, mobile-layout toast), dark `--primary` lighter (buttons keep dark `primary-foreground` text: 4.93 -> 5.76). `--ring`, `--chart-1` and `--sidebar-primary` were left at their previous dark values. No test or component pins these values (grepped).

### State identification without color (task 1.2 findings)

Goals page, Project Detail (same `GoalsList`/`GoalsMobileCards`) and goal detail (same `StatusBadge`, `BlockedIndicator`, `GoalProgressDisplay`): Active/Paused/Completed/Archived are text badges; Blocked/Restricted are a text label plus a lock/link icon in a keyboard-reachable button whose tooltip lists the reasons; progress is a `role="progressbar"` with `aria-valuetext` naming Actual and Potential, a percent, an info popover trigger with an `aria-label` (desktop) or `aria-expanded` footer (mobile); the ceiling marker is hue-only and `aria-hidden` but its meaning is carried by the Restricted label/tooltip and the remaining text. The drag handle is a grip icon with `aria-label` "Drag {entity} to reorder"; the priority number is text with a screen-reader "Priority" prefix inside the row's content; the conflict banner is `role="alert"` with text Retry/Dismiss; the mobile bar's hint/saving status is a polite live region and the toggle exposes `aria-pressed` with a label swap to "Done". One gap found and fixed: the mobile reorder cards (in-flight rows only) had no state text, so a Paused card looked like an Active one; each card now shows its `StatusBadge`. Test coverage added in `goals-list.test.tsx`.
