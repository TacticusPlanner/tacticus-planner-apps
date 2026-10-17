# Tasks

No companion API change: past authored occurrences and projected placeholders are already served in `events-calendar`.

## 1. Model

- [ ] 1.1 Add `listHomeScreenEventInstances` and `homeScreenEventInstanceKey` to `features/daily-raids/model/select-active-home-screen-event.ts` (design D1, D2); verify `select-active-home-screen-event.test.ts` covers running/upcoming/past grouping, placeholder keys, the 2026-10-26 same-start ordering by definition id, and that the default still follows the overlap rule.
- [ ] 1.2 Replace `selectHomeScreenEventListTarget` with `selectListTarget(instance)` (design D4); verify the table in D4 case by case, including a past rule-bearing instance yielding no target.
- [ ] 1.3 Extend `use-active-home-screen-event.ts` to load from 400 days back and expose `instances`; verify `use-active-home-screen-event.test.tsx` covers a past entry and the tick moving an instance from running to past.

## 2. UI

- [ ] 2.1 Add `features/daily-raids/ui/home-screen-event/event-switcher.tsx` (`data-testid="hse-event-switcher"`): grouped select with localized names, Faction Boost target, date ranges, Previous / Next buttons with accessible names and disabled ends; desktop inline and mobile full-width row (design D5); verify `event-switcher.test.tsx` covers grouping, ordering, disabled ends and both layouts.
- [ ] 2.2 Update `event-status-line.tsx` for the "Ended on" state and `event-preview-banner.tsx` for any selected upcoming instance; verify their tests.
- [ ] 2.3 Wire `pages/dailies/ui/hse-page.tsx` to the `event` search param (design D3): resolve, fall back, drop stale keys with `replace`, clear on default; verify `hse-page.test.tsx` covers every scenario of "The HSE tab switches between Home Screen Event instances" and the modified empty-state and preview requirements.

## 3. Tour and i18n

- [ ] 3.1 Add `pages/dailies/ui/hse-page.tutorial.tsx` with desktop and mobile steps (switcher, status line, farm list, top-10 lists) registered via `useTourPageSteps`, and its `tour.hse.steps.*` keys; verify `hse-page.tutorial.test.tsx` at one viewport below and one at or above 768px.
- [ ] 3.2 Add switcher, group, "Ended on" and tour copy to `dailies.json` in en, de, es and fr with real translations; verify `dailies-translations.test.ts`.

## 4. Desktop verification (>= 768px)

Data states: a running HSE (or a fixture clock inside one), an upcoming rule-bearing HSE after the next one, a past HSE.

- [ ] 4.1 Switcher on the title row; Previous / Next step through instances; the URL updates and a reload keeps the selection.
- [ ] 4.2 Past rule-bearing instance hides lists and header controls; a later upcoming rule-bearing instance shows the preview.
- [ ] 4.3 Tour steps target the right elements.

## 5. Mobile verification (< 768px, 420px iframe)

- [ ] 5.1 Switcher renders on its own row with arrows; select is usable.
- [ ] 5.2 Same instance states as 4.2; tour steps target the right elements.

## 6. Gates

- [ ] 6.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`.
