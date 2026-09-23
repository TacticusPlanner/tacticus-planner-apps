## Context

Goal rows/cards reuse status badges and progress visuals; semantic colors come from shared UI tokens in `packages/ui/src/styles/globals.css`. The density change adds Compact to Overview and must be checked without losing the Actual/Potential explanation.

## Goals / Non-Goals

**Goals:** Measured WCAG 2.2 AA contrast for in-scope rendered states and redundant non-color cues.

**Non-Goals:** Product-wide rebrand or removal of existing status colors.

## Decisions

- Audit actual rendered foreground/background pairs in light and dark themes, not token values in isolation. Use 4.5:1 normal text, 3:1 large text, and 3:1 meaningful non-text boundaries/states, per [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/#contrast-minimum) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast).
- Prefer correcting semantic tokens when several Goal components share a failure; use local adjustments only where the background or state is truly specific. Recheck other consumers of any changed shared token.
- Keep status/restriction words or named icons; do not depend on color, and preserve keyboard-reachable progress explanations.

## Risks / Trade-offs

- A global token change may alter unrelated pages → audit consumers and screenshot both themes before accepting it.
- Thin progress markers can pass nominal colors yet appear faint → inspect rendered pixel thickness and increase prominence if needed.

## Open Questions

- Which rendered combinations fail today? Record measured pairs in the implementation audit and limit visual edits to those failures; the threshold and required non-color cues are already fixed here.
