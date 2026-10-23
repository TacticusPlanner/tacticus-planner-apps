## 1. Reproduction

- [ ] 1.1 Switch the app to de and fr in the Aspire stack and capture which labels clip on: Today schedule rows, the Home raids widget rows, the Today project selector, and the Dailies tab row / desktop section menu, at one viewport below 768px and one at or above; record each surface as reproduced or ruled out.

## 2. Fix

- [x] 2.1 Replace `truncate` with wrapping on the campaign name and node label in `today-page.tsx` and `location-row.tsx`; verify de/fr labels show in full and icon alignment holds.
- [x] 2.2 Replace the fixed `w-56` on `ProjectSelect` with a minimum width; verify the longest localized project name and the "All projects" placeholder render in full and the popper content stays aligned.
- [x] 2.3 Fix the Dailies navigation label clipping found in 1.1 (tab trigger or section-menu item); verify no label is cut in de/fr on both platforms.
- [x] 2.4 Update affected tests (`today-page`, `location-row`, `project-select`, `section-tabs`); verify they pass.

## 3. Verification

- [ ] 3.1 Desktop verification (≥768px) in de and fr: Today schedule, Home raids widget, project selector, Dailies section menu — no clipped labels.
- [ ] 3.2 Mobile verification (<768px) in de and fr: Today schedule, Home raids widget, project selector (icon-only trigger unaffected), Dailies tab row — no clipped labels.
- [x] 3.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.

## Notes (as built)

- 1.1 was done from code, not in the browser. Clipping candidates found: `truncate` on the campaign/node lines in `today-page.tsx` (Today's attempts list), `resource-card.tsx` (the Today/Bonus schedule's `raid-location-*` rows, rendered by `RaidSchedule`) and `location-row.tsx` (Home raids widget); the fixed `w-56` on `ProjectSelect`; `truncate` on desktop section-menu item labels (`desktop-section-navigation.tsx`, fixed `w-52` column). The mobile `SectionTabs` triggers are `whitespace-nowrap` in an `overflow-x-auto` row with no truncating class, so they were ruled out in code; a test now pins that. The visual reproduction is still open.
- 2.1 also covers `resource-card.tsx`: the Today schedule's location rows render there, not in `today-page.tsx`. Truncation became `break-words`; rows keep `items-center`, so icons and the raid-count badge stay vertically centred on a two-line label. `event-location-row.tsx` (HSE/HRE) was left alone because it is outside these specs.
- 2.2: the trigger is now `min-w-56`. The shared `SelectTrigger` is `w-fit whitespace-nowrap`, so the content sets the width. The popper alignment check is part of the visual verification.
- 2.3: section-menu item labels now wrap with `break-words` instead of truncating, and keep their existing `title`. The menu is shared, so this applies to every section, not only Dailies. The section-name header row keeps `truncate` because it is not a tab label.
- 2.4: added `location-row.test.tsx` and long-label tests in `dailies-pages`, `raid-schedule`, `project-select`, `section-tabs` and `desktop-section-navigation`. The last two use the shipped de/fr `dailies.json` tab labels. Existing `.truncate` selectors in `dailies-pages`, `raid-schedule` and `raids-widget` were updated.
- No new or changed strings, so there are no translation changes.
