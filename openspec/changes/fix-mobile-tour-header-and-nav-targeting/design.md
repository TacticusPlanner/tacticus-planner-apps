## Context

`general.tutorial.tsx` targets `[data-testid="mobile-header"]` and `[data-testid="primary-nav"]` for the relevant mobile steps. The former is sticky and the latter fixed. The companion account-drawer change handles a different animated target.

## Goals / Non-Goals

**Goals:** Measure and correct the rendered target/callout alignment in the live mobile shell.

**Non-Goals:** Rewrite the tour, change shell navigation, or assume drawer timing explains these reports.

## Decisions

- Record actual target rectangles, spotlight rectangles, scroll container, visual viewport, and selector resolution before choosing a fix. Use the existing `general.tutorial.tsx`/shared-tour ownership; do not add page-local tour logic.
- Prefer a scoped Joyride positioning or target-refresh correction over global sticky/fixed CSS changes that would alter ordinary navigation.
- Fold into the account-drawer change only if the live diagnosis finds the same shared cause; otherwise retain this independently reviewable change.

## Risks / Trade-offs

- Browser chrome and safe areas are difficult to emulate in unit tests → pair selector/refresh tests with real mobile viewport checks.
- No reproduced mismatch may mean no code is justified → document evidence and close the conditional proposal without speculative CSS.

## Open Questions

- Does either report reproduce on the current stack, and does it share a cause with drawer targeting? The diagnostic task settles this before selecting a patch; no new tour behavior is assumed beyond the alignment contract.
