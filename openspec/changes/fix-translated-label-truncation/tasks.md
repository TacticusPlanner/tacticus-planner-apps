## 1. Reproduction

- [ ] 1.1 Switch the app to de and fr in the Aspire stack and capture which labels clip on: Today schedule rows, the Home raids widget rows, the Today project selector, and the Dailies tab row / desktop section menu, at one viewport below 768px and one at or above; record each surface as reproduced or ruled out.

## 2. Fix

- [ ] 2.1 Replace `truncate` with wrapping on the campaign name and node label in `today-page.tsx` and `location-row.tsx`; verify de/fr labels show in full and icon alignment holds.
- [ ] 2.2 Replace the fixed `w-56` on `ProjectSelect` with a minimum width; verify the longest localized project name and the "All projects" placeholder render in full and the popper content stays aligned.
- [ ] 2.3 Fix the Dailies navigation label clipping found in 1.1 (tab trigger or section-menu item); verify no label is cut in de/fr on both platforms.
- [ ] 2.4 Update affected tests (`today-page`, `location-row`, `project-select`, `section-tabs`); verify they pass.

## 3. Verification

- [ ] 3.1 Desktop verification (≥768px) in de and fr: Today schedule, Home raids widget, project selector, Dailies section menu — no clipped labels.
- [ ] 3.2 Mobile verification (<768px) in de and fr: Today schedule, Home raids widget, project selector (icon-only trigger unaffected), Dailies tab row — no clipped labels.
- [ ] 3.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
