## 1. Calendar model and ordering

- [x] 1.1 Extend the local day-bucket view model with multi-day occurrence start/end metadata, using the existing exclusive-end, time-zone, and DST-safe date-membership rules; verify focused calculation tests cover first, intermediate, and last days.
- [x] 1.2 Add a single per-day mobile-list priority helper that orders non-recurring events lasting at most seven days, then recurring one-day modifiers, then events lasting more than seven days; verify an LRE, Double Gold, and Battle Pass order as LRE → Double Gold → Battle Pass and test deterministic tie-breaking.
- [x] 1.3 Cover one-day occurrences, including Double Gold and Double XP, to verify they receive neither boundary marker nor an incorrect multi-day classification; retain the existing UTC-midnight and DST regression coverage.

## 2. Events Calendar presentation

- [x] 2.1 Update the mobile Events Calendar surface to use the established mobile horizontal content inset and pass each day entry's boundary metadata to its card; verify the mobile renderer exposes the expected layout and start/end marker states.
- [x] 2.2 Update event cards to remove visible `Live now` and `Projected` chips while preserving visible active and projected/confirmed differentiation; render localized start/end tags only for multi-day occurrence boundaries and verify card tests cover all states.
- [x] 2.3 Replace the icon-only external Wiki control with a compact, button-styled external `Wiki` action in both mobile list cards and desktop bars, preserving safe new-tab behavior and title truncation; verify cards with and without Wiki URLs.
- [x] 2.4 Add localized Wiki and start/end labels to every supported `events` locale (en, de, es, fr), update the Events Calendar tutorial copy for the revised status and verify translation-namespace alignment plus automated tutorial coverage.

## 3. Verification

- [ ] 3.1 Manually verify the authenticated local stack at a viewport below 768px with a multi-day event on its first, middle, and last day, a one-day Double Gold or Double XP occurrence, and an overlapping LRE/Double Gold/Battle Pass day; verify padding, marker exceptions, Wiki button, and order.
- [ ] 3.2 Manually verify the authenticated local stack at a viewport at or above 768px and run the revised Events Calendar Joyride tour at both viewport sizes; verify the desktop layout remains usable and the tour describes the changed calendar signals.
- [x] 3.3 Run focused Events Calendar model, card, renderer, translation, and tutorial tests, then run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check` successfully.
