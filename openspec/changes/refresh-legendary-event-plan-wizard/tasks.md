# Tasks

Prerequisite: `speed-up-legendary-event-plan-wizard` is merged (this change uses its `targetSettled` and debounced economy).

Required data states for verification:

- (a) The reference account with an active or upcoming event, at least one stored team in a lane, an Active goal for an event unit, and a target that Needs upgrades.
- (b) An account or event where the target is Reachable now.
- (c) An event whose unit is fully ascended (no step left to reach).
- (d) A forced goal-creation failure: create a conflicting goal in another tab first.

## 1. Navigation and layout

- [ ] 1.1 Keep the step in `?step=` in `plan-wizard.tsx` (history entries on Next / Back / stepper; fall back to the furthest visited step; `visited` in state). Verify that tests cover browser Back moving one step without the leave prompt, a reload starting at Target with `?step=target`, and a deep link to an unvisited step falling back.
- [ ] 1.2 Footer: `bottom-(--mobile-nav-height)` below 768 px, `bottom-0` above, negative margin matching `PageContainer`. Verify with a test asserting the classes per `useIsMobile()`, plus the mobile verification group.
- [ ] 1.3 Mobile step chips (visited steps tappable) in the step header, keeping the progress bar. Verify that a test asserts unvisited chips are disabled.

## 2. Plan summary

- [ ] 2.1 Add `plan-summary.tsx` (target · verdict, ceiling vs needed or spare, goals count, team changes; Too ambitious warning with Change target; `aria-live` announcement of the default-target move), rendered as a right rail at ≥1024 px, a strip above the content from 768 to 1023 px, and a sticky expandable strip below 768 px. Remove the separate banner. Verify that tests cover the tick scenario from the spec (+450 spare → 9,100 of 10,000), the Too ambitious link, and both placements.

## 3. Target step

- [ ] 3.1 Add `target-card.tsx` (radio semantics, arrow keys, 44 px target, two-segment bar capped at 100% with a spare label, dimmed Checking state). Replace the radios in `target-step.tsx`. Verify that tests cover the Unlock bar worked example (61% solid, capped hatched, the copy) and keyboard selection.
- [ ] 3.2 Move `RunInputsForm` into a collapsed Assumptions disclosure with the per-run summary header (open state per device), and move the potential maps under Why this verdict?. Verify that tests cover the summary text from the spec and that edits still reach the debounced economy.
- [ ] 3.3 Default target: null until chosen; `targets[0]` while the search runs, then `options.best`; an explicit choice or `?target=` wins; analytics only on an explicit choice. Verify that tests cover the one-time move and that an explicit choice is never replaced.

## 4. Upgrades step

- [ ] 4.1 Group by `firstRun`, show "→ ceilingAfter / target" per row with the note, and add Just enough / All / None. Verify that tests cover group order, each quick action's ticks, and toggling across groups still ticking a unit's earlier recommendations.
- [ ] 4.2 Track manual ticks: auto-tick new finds until a manual toggle, then show "N new suggestions not ticked" with Tick them. Verify the spec scenario with a stubbed exploration.

## 5. Teams step

- [ ] 5.1 Per-team Undo with struck-through removed rows, and Restore all. Verify the Undo scenario.
- [ ] 5.2 Edit through `TeamEditorDialog` (writes `adjustments.edited`) and Add a team (appends to `adjustments.added`). Add `update` entries to `planWrites` and send them in `writeLane` between removals and creations with `updateLegendaryEventTeam`. Verify that `plan-create.test.ts` and `use-plan-create` tests cover an edited stored team producing one update (no removal and creation), retries skipping an already-applied update, and an added team being created.
- [ ] 5.3 Depth bars per run, Keep / Replace segmented control with counts, lanes side by side at ≥1024 px, and accessible tabs (`aria-controls`, tab panels, arrow keys) below 768 px. Verify that tests cover the counts and the tab semantics.

## 6. Runs and tokens step

- [ ] 6.1 Add optional `openKey`, `defaultOpen` and `trackExpand` to `TokenPlanList` and `RunForecastSection` in `features/legendary-event-tokens` (defaults unchanged). The wizard passes wizard-only keys, `defaultOpen: true` and `trackExpand: false`, and wires `onOpenTeams` to `?step=teams` with the lane selected. Verify that the event-page tests for both components pass unchanged, and that new tests cover the wizard rendering them expanded, firing no expand events, and following the leftover link.

## 7. Review step and creation

- [ ] 7.1 Add the heading, the Goals / Teams / Run inputs cards with "Nothing to change", named removals (destructive), updates and creations, and the counted Create label. Verify the named-removal scenario.
- [ ] 7.2 Keep Retry failed enabled whenever Create is not running, and keep the leave guard on while a failed item remains. Verify the partial-failure scenario with a mocked failing goal creation.
- [ ] 7.3 Add the `nothingToReach` source state and the named missing dataset in the clear-estimates state (`plan-wizard-page.tsx`, `use-plan-source.ts`). Verify that tests cover both states.

## 8. Copy and tour

- [ ] 8.1 Add or change the `planWizard.*` keys (summary, cards, Assumptions header, Why this verdict?, upgrade groups and quick actions, new-suggestions line, team Undo / Restore all / Edit / Add / counts, review cards and named lines, counted Create label with plurals, pluralised toast, nothing-to-reach and missing-dataset states, partial-failure leave prompt) in `apps/web/public/locales/{en,de,es,fr}/legendaryEvents.json` with real German, Spanish and French translations, at the quality of the sibling namespaces, including `_one`/`_other` plural forms. Verify that the i18n key-parity test passes and no de/es/fr value equals its English source except proper nouns.
- [ ] 8.2 Update `plan-wizard.tutorial.tsx` to the new desktop targets (stepper, target cards, Assumptions, summary rail, footer) and mobile targets (step header and chips, cards, Assumptions, summary strip, bottom bar), and update `tour.planWizard.steps.*` in all four locales with real translations. Verify that the tutorial test asserts every target selector renders on the Target step at both widths.

## 9. Gates

- [ ] 9.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check` from `tacticus-planner-apps`; all pass.

## 10. Shared verification (data states a–d)

- [ ] 10.1 (a) The default target moves at most once to the highest step within reach, and the summary announces it.
- [ ] 10.2 (b) Reachable now shows "+N spare", and Upgrades says no upgrades are needed.
- [ ] 10.3 (c) The nothing-to-reach state shows, with its link back to the event.
- [ ] 10.4 (d) After the forced failure, Retry failed is enabled at once and leaving asks first.
- [ ] 10.5 Review lists names for removals and updates, and Create completes and returns to Overview with the pluralised toast.

## 11. Desktop verification (viewport at or above 768 px; check 1280 px and 900 px)

- [ ] 11.1 At 1280 px, the target cards are visible without scrolling. At 900 px, the summary sits above the content as a strip.
- [ ] 11.2 Browser Back and Forward move between steps, with no leave prompt.
- [ ] 11.3 On Teams, the lanes sit side by side at 1280 px, and Edit and Add open the team editor.
- [ ] 11.4 Runs and tokens opens expanded, and the leftover link opens Teams on that lane.
- [ ] 11.5 The desktop tour targets every step.

## 12. Mobile verification (viewport below 768 px, 390 px same-origin iframe per `tp-manual-ui-verification`)

- [ ] 12.1 Confirm the mobile layout renders: chips, progress bar, summary strip, no stepper.
- [ ] 12.2 Back / Next stay visible above the bottom navigation while scrolling every step, and nothing scrolls horizontally.
- [ ] 12.3 The summary strip expands on tap, visited chips navigate, and the Teams lane tabs work with touch.
- [ ] 12.4 The mobile tour's tooltips stay inside the viewport on every step.

## Workflow follow-up

- Sync the MODIFIED and ADDED requirements into `openspec/specs/legendary-event-plan-wizard/spec.md` on archive.
