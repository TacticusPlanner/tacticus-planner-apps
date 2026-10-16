# Tasks

Paths are under `apps/web/src/fsd` unless stated. Commands from the repository root (`pnpm --filter web exec vitest run <file>` for one file).

## 1. Filter chips

- [x] 1.1 Add one chip style (a class constant or a thin `FilterChip` in `shared/ui`) with `data-[state=on]:border-2 data-[state=on]:border-primary data-[state=on]:bg-primary/10` and use it in `pages/legendary-events/ui/master-table/master-table-controls.tsx`, `tier-list/tier-list-filters.tsx` and `legendary-event/leaderboard/leaderboard-controls.tsx` (spec: a selected filter chip is visibly different from an unselected one). Verify: component tests assert the pressed chip carries the on-state classes and `aria-pressed`, and a unit test computes the border colour contrast against the page background in the light and dark tokens and asserts at least 3:1.
- [x] 1.2 Check the shared `ToggleGroup` consumers outside the Legendary Event pages (theme switcher, goal forms, library header) are untouched, and record in the PR whether promoting the chip style to the shared component is worth a follow-up. Verify: `git diff --stat` shows no change under `packages/ui`.

## 2. Tour

- [x] 2.1 Add `data-testid="legendary-event-token-plan-header"` to the Token plan card's header row in the tokens feature and point the `tokenPlan` step in `pages/legendary-events/ui/legendary-event/legendary-event.tutorial.tsx` at it (spec: the Events pages have Joyride tours). Verify: the tutorial test asserts the step target selector and a test with a 24-token plan asserts the tooltip rectangle lies inside a 1280 by 784 viewport at that step.
- [x] 2.2 Sweep the other 11 event page steps for tall targets (Synced progress, Lane overview) with the same viewport assertion. Verify: the test covers every step of the event page tour on desktop and mobile widths and passes.

## 3. Labels

- [x] 3.1 Change `laneSummary.battles` to "{{cleared}} / {{total}} battles fully cleared" and the Run status currency line to "{{value}} currency in hand" in `public/locales/{en,de,es,fr}/legendaryEvents.json` with real de, es and fr translations (spec: Overview summary and Run status). Verify: the lane summary and Run status tests read the new strings ("7 / 18 battles fully cleared", "120 currency in hand") and the four locale files carry the keys.

## 4. Team display names

- [x] 4.1 Add `entities/legendary-event/lib/team-display-name.ts` (`teamDisplayName`: stored name unless empty or equal to the lane id, then covered objective labels joined by " · ", else "Team N" by lane position) and export it from the entity index. Verify: `team-display-name.test.ts` covers the three spec scenarios (imported "alpha" with Max 2 Hits and Melee, "Melee rush" kept, objective-less second team "Team 2") and case-insensitive "Alpha".
- [x] 4.2 Use it on the team card, the token plan groups and rows (`token-groups.ts`), the Next token card and its prompts, upgrade-impact rows, run-history team lines and as the editor's name prefill for such teams (spec: a team shows a readable name wherever it is named; editing offers the readable name). Verify: component tests assert the card title "Max 2 hits · Melee", the prompt "Set how far Max 2 hits · Melee clears", that display alone sends no write, and that saving an edit without touching the field stores the readable name.

## 5. Verification

- [x] 5.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `pnpm test:run`. Verify: all four succeed.
- [ ] 5.2 On staging at 1280px and in a same-origin 420px frame, in both themes: master table and tier list chips read clearly, the event page tour's Token plan step shows its tooltip fully on Uthar with the plan expanded, the Overview shows "fully cleared" and "in hand", and Uthar Alpha's imported team shows its objective title. Verify: each matches its spec scenario; attach screenshots to the PR.

## Workflow follow-up

- Archive after staging is verified.
- Consider promoting the chip style to the shared toggle-group after reviewing its other consumers.
