## 1. Audit

- [x] 1.1 Inventory goal badges, labels, progress fills/markers, controls, and dense rows/cards in light/dark themes and measure actual foreground/background contrast; include the reorder states (drag handle, priority number, a dragged row, mobile reorder bar, order-conflict banner) and Paused rows; verify a recorded matrix identifies every failing pair and applicable threshold.
- [x] 1.2 Inspect state identification without color on the Goals page, Project Detail, and goal detail at mobile/desktop widths, including the reorder controls' accessible names and the conflict banner announcement; verify any missing text/icon/accessible name is recorded.

## 2. Corrections and verification

- [x] 2.1 Correct failing semantic tokens/components and add redundant cues without changing goal semantics; verify automated contrast/state tests and no regression in other consumers of altered tokens.
- [ ] 2.2 Manually inspect populated, empty, blocked, reached, Paused, archived, dragging, reorder-mode, and order-conflict states in both themes and Comfortable/Compact where present at mobile/desktop widths; verify the measured matrix now passes and progress explanations remain operable.
- [x] 2.3 Add any changed UI copy to every supported locale, then run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
