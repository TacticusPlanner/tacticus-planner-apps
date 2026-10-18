# Tasks

No API change beyond `add-hse-points-projection` (served `config.hse`). Builds on `add-hse-instance-switcher` and `add-hse-points-projection`.

## 1. Model

- [x] 1.1 Add the `event-unit` rationale kind (with trait or faction) to `team-recommendations.types.ts`; verify existing engine and team tests still pass.
- [x] 1.2 Add `pages/dailies/model/hse-team-recommendations.ts`: event units per mode (design D2), alliance narrowing, engine call (D3), enemy hints; verify tests cover the Psyker Imperial and Chaos teams, Faction Boost double-match ranking, Defeat Waves without a player filter, the Faction Focus faction pick with its tie-break, For the Emperor's hint, Squig Smash's hint, the insufficient-roster case, and single-mode 11th Edition Week 2.
- [x] 1.3 Add `use-hse-team-recommendations.ts` reading roster and catalog for the selected instance; verify loading, failure, past, global and no-data states.

## 2. UI

- [x] 2.1 Add `pages/dailies/ui/hse-teams/` (`data-testid="hse-teams"`): desktop Arena card plus two alliance rows; mobile segmented control with stacked cards; reuse `team-list`, `team-recs-state` and `track-shortfall`; verify tests cover both layouts, the hint and the broadened marker.
- [x] 2.2 Place the section below the projection in `hse-page.tsx`; verify `hse-page.test.tsx` shows it for Psyker Boost and hides it for a past event.

## 3. Tour and i18n

- [x] 3.1 Add the teams step to `hse-page.tutorial.tsx` (desktop and mobile) with its `tour.hse.steps.*` keys; verify the tutorial test at one viewport below and one at or above 768px.
- [x] 3.2 Add section, hint and rationale copy to `dailies.json` and `teamRecs.json` in en, de, es and fr with real translations; verify the translation tests.

## 4. Desktop verification (>= 768px)

Data states: a roster with Psykers in every alliance and one alliance with fewer than three characters (or fixtures); Psyker Boost upcoming; Faction Focus; For the Emperor.

- [ ] 4.1 Seven Psyker Boost teams in the grid; Psykers lead; broadened marker where filled.
- [ ] 4.2 Faction Focus faction pick and For the Emperor hint; tour step.

## 5. Mobile verification (< 768px, 420px iframe)

- [ ] 5.1 Segmented control switches modes; alliance teams stack; tour step.

## 6. Gates

- [x] 6.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`.
