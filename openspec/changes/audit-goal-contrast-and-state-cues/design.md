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
