# Design

## Context

See proposal.md, Why. The wizard is a page in the `pages/legendary-events` slice (`ui/plan-wizard/`). Its draft lives in `usePlanDraft`, the step in local state in `PlanWizard`, and each step is its own component. The change builds on `speed-up-legendary-event-plan-wizard`, which adds `targetSettled` and a debounced search economy. Everything here is presentation and draft state, and nothing is written before Create, so the creation order and the write queue are unchanged.

## Goals / Non-Goals

**Goals:**

- The Target step's decision is visible without scrolling at 390×844 and 1280×800.
- At every step the user can see what the plan adds up to.
- Every action the user can take is undoable before Create, and every destructive write is named on Review.
- No dead ends: each state has a way forward or back.

**Non-Goals:**

- Changing the generation model, the verdicts or the recommendations (`legendary-event-plan-generation`).
- A saved draft across reloads (the step goes in the URL for history navigation; the draft does not, so a reload starts at Target).
- Reordering teams within a lane in the wizard.

## Decisions

1. **Target cards over radios.** `TargetCard` (a `role="radio"` button inside a `role="radiogroup"`, arrow-key navigable) shows the step name, its points target, the verdict badge and a two-segment bar. The solid segment is the synced ceiling, and the hatched segment adds the ceiling with every recommended upgrade, both against the target. The bar caps at 100% with a "+N spare" label. While the search runs, the hatched segment uses the dimmed **Checking** style from the speed-up change. Alternative: keep radios and add the bar. Rejected because the cards are the step's main control and need a 44 px touch target with room for the bar.

2. **Run inputs in an Assumptions disclosure.** The existing `RunInputsForm` moves unchanged into a collapsible panel (closed by default, open state per device under `legendaryEvents.planWizard.assumptions.open`). The header summarises each plan run ("Run 2: 6 of 8 missions · bundle · Run 3: 0 of 8 missions") and adds "· paid options on" when that switch is on. Editing still feeds the debounced economy. Alternative: move run inputs to the Runs step, as the original spec intended. Rejected because the verdicts on Target depend on them, so they must be reachable from Target.

3. **Default target = highest step within reach.** `usePlanDraft` keeps `target` null until the user or `?target=` chooses one. While it is null, the chosen target is `options.best` once the search is done, and `targets[0]` before then. The cards show the default as selected, so the selection may move once, when the search ends. To make that move visible, the summary announces it through an `aria-live="polite"` line ("Five stars is the highest step within reach"). Analytics' `target_chosen` fires only for an explicit choice, as today.

4. **One plan summary, two placements.** `PlanSummary` takes the draft and the writes and renders target · verdict, "ceiling X of Y needed" (or "+Z spare"), goals to create, and team changes (+created / −removed). On desktop (≥768 px) it is a right rail beside the step content (the stepper stays on the left, and the content column narrows). On mobile it is a one-line sticky strip under the step header that expands on tap. The Too ambitious warning becomes the summary's verdict line with a **Change target** link, and the separate banner is removed. This is documented as its own desktop/mobile split because the placement and the interaction (always visible vs tap to expand) differ.

5. **Upgrades grouped by first run, with manual-tick tracking.** Groups are "Ready for run N", in `firstRun` order, preserving the global order within a group. Ticking still uses `toggleRecommendation` across groups. `userTicks` stays null until a manual toggle, so the default prefix keeps growing with new finds. Once set, the step counts the recommendations found after the last manual toggle and offers **Tick them**. **Just enough** resets `userTicks` to null, **All** ticks every key and **None** ticks none. Each row shows "→ ceiling after / target" from `ceilingAfter`, which is the ceiling with every earlier recommendation in the list. A note explains that unticking earlier rows changes the later numbers, and the summary shows the actual ceiling of the ticked set.

6. **Teams: per-team undo, edit and add through the existing adjustments model.**
   - Remove still adds the key to `adjustments.removed`. A removed team stays in its lane, struck through, with **Undo**, which deletes that one key. **Restore all** clears the set.
   - **Edit** opens `TeamEditorDialog` with the draft team, the run's projected roster and the lane, and its submit writes `adjustments.edited`.
   - **Add a team** opens the editor empty and appends to `adjustments.added`. These fields already flow through `laneStart` and `planWrites`. An edited stored team becomes an update write, so `planWrites` gains `update` entries per lane, and `writeLane` sends them through the existing team update call between removals and creations.
   - Depth shows as a bar per run of battles cleared out of the lane's battle count.
   - Desktop: three lane columns side by side (≥1024 px; stacked from 768 to 1023 px). Mobile keeps the lane tabs, with `aria-controls` and tab panels.

7. **Runs and tokens step expanded.** `TokenPlanList` and `RunForecastSection` gain optional `openKey`, `defaultOpen` and `trackExpand` props. The defaults reproduce today's event-page behaviour. The wizard passes wizard-only keys, `defaultOpen: true` and `trackExpand: false`. `onOpenTeams(laneId)` navigates to `?step=teams` and selects that lane.

8. **Review as cards with named removals.** The Goals, Teams and Run inputs cards each say "Nothing to change" when empty. Removals list each team's stored name with a destructive icon ("Remove 'Melee' from Alpha"), and updates and creations list their names. The Create label is pluralised from the writes ("Create 4 goals and 3 teams", "Save run inputs" when only run inputs change). The toast uses the same plural keys.

9. **Step in the URL.** `?step=<target|upgrades|teams|runs|review>`, written with `replace: false` on Next, Back and stepper clicks, so the browser history holds the steps. `UnsavedChangesGuard` already compares only the pathname, so step changes are never blocked. On load or Back, a step after the furthest visited one falls back to the furthest visited one, and `visited` is held in state, not the URL. Mobile step chips (visited steps only) replace the text-only progress header, and the progress bar stays.

10. **Mobile footer above the bottom nav.** The footer uses `bottom-(--mobile-nav-height)` below 768 px and `bottom-0` above. Its negative margin follows `PageContainer` (`-mx-4 sm:-mx-6`), so the border spans the container.

11. **Dead-end and failure states.**
    - `PlanSource` gains `status: "nothingToReach"` when `stepTargets` is empty. The page explains why (fully ascended, or the event has no reward ladder) and links back to the event.
    - The clear-estimates state names the missing dataset (unit power, or horde-mode tiers).
    - After a partial failure, Retry failed is enabled whenever Create is not running. It already sends the frozen snapshot, so it doesn't wait for the search.
    - While a failed item remains, `UnsavedChangesGuard` stays on with "Some items failed. Leave without retrying?".

## Risks / Trade-offs

- [Making the default target move once when the search ends can surprise users] → the move is announced in the summary, it happens at most once, and any explicit choice stops it.
- [The summary rail narrows desktop content] → the rail is 16rem, and from 768 to 1023 px it moves above the content as a strip.
- [Team edits add an update write path] → it uses the existing team update entity call through the write queue, tested in `use-plan-create` tests.

## Migration Plan

Front end only. It ships after `speed-up-legendary-event-plan-wizard`. Rollback is reverting the PR.
