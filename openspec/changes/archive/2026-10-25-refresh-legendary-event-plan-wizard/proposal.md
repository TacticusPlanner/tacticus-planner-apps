# Proposal

## Why

The 1-click plan wizard works, but it is hard to read and has several dead ends. A code audit on 2026-10-23 (no screenshots; paths under `apps/web/src/fsd/pages/legendary-events/ui/plan-wizard`) found these problems:

- **The choice is buried.** The Target step renders the deadline, then the full run-inputs form (a per-run mission checklist), then the target radios, then three roster potential maps (`target-step.tsx:70-210`). The target, the step's one decision, sits below the fold. It also defaults to the next step even when that step is Too ambitious (`use-plan-draft.ts`, `chosenTarget = … ?? targets[0]`).
- **There's no running picture of the plan.** The only cross-step signal is a red banner shown when the target is Too ambitious (`plan-wizard.tsx:225-252`), so the user has to reach Review to see what the plan adds up to.
- **Upgrades are a flat list.** It shows no running total of how close each tick gets to the target. Ticking during the search freezes the auto-ticks, so later finds stay unticked (`use-plan-draft.ts`, `userTicks` keyed on the list so far).
- **Teams can only be removed, all at once.** Restore brings back every removed team. Teams can't be edited or added, although the draft model supports both (`plan-evaluator.ts` `TeamAdjustments.edited`/`added` are never set). Depth reads as text ("Run 2: battle 5 · Run 3: none"), and Keep / Replace doesn't say what it changes.
- **The Runs step hides its content.** Both sections render collapsed by default and share their open state and analytics events with the event page (`legendary-event-tokens/model/use-stored-open.ts`). The "leftover tokens" link does nothing (`runs-step.tsx`, `onOpenTeams={() => undefined}`).
- **Review is plain text.** It has no step heading. Team removals show as counts ("Alpha: remove 2 teams") without names, although they delete the user's stored teams. The toast reads "1 goals" (`planWizard.toast.created` is not pluralised).
- **Navigation:**
  - The step isn't in the URL, so browser Back leaves the wizard (behind the leave prompt) instead of going back one step.
  - On mobile the sticky footer is `bottom-0` under the fixed bottom nav (`plan-wizard.tsx:292`, `app/layout/mobile-layout.tsx:227`), so Back / Next is hidden until you scroll to the end.
  - Mobile has no way to jump to a visited step.
- **Dead ends:**
  - With no step left to reach (unit fully ascended, or no reward ladder), Target shows one line and Next stays disabled, with no way forward.
  - After a partial Create failure, Retry is greyed out while the reads refresh, and the leave guard switches off (`plan-wizard.tsx:330`, `create.items.length === 0`).

## What Changes

- **Target step, choice first.** Target cards lead the step. Each card shows the step, its points target, a bar of the synced ceiling and the upgraded ceiling against that target, and the verdict. Run inputs move into a collapsed **Assumptions** panel whose header summarises them per run. The potential maps move under a **Why this verdict?** disclosure. The default target becomes the highest step within reach once it is known (an explicit choice or `?target=` wins).
- **Plan summary.** A summary shows on every step: target · ceiling vs needed · goals to create · team changes. It's a right rail on desktop and a compact sticky strip under the step header on mobile, and it replaces the Too ambitious banner (the warning moves into it).
- **Upgrades step.** Recommendations are grouped by the first run they help. Each row shows the ceiling after it against the target. Quick actions: **Just enough** (the target's prefix), **All**, **None**. New finds keep being auto-ticked until the user ticks or unticks by hand; after that, a line says "N new suggestions not ticked" with a **Tick them** action.
- **Teams step.**
  - Each removed team gets its own **Undo**, and **Restore all** stays.
  - **Edit** opens the existing `TeamEditorDialog` from `@/features/legendary-event-plan` on the draft, and **Add a team** adds the next suggestion or opens the editor empty.
  - Depth per run shows as a small bar of battles cleared out of the lane's battles.
  - Keep / Replace becomes a segmented control with counts.
  - The three lanes sit side by side on desktop.
- **Runs and tokens step.** The token plan and run forecast open expanded in the wizard. They use wizard-only open-state keys and don't fire the event page's expand events. The leftover-tokens link opens the Teams step on that lane.
- **Review step.** A heading and three cards: Goals, Teams, Run inputs. Team removals are listed by name in destructive styling. The Create button carries the counts ("Create 4 goals and 3 teams"), and the toast is pluralised.
- **Navigation.**
  - The step lives in the URL (`?step=`), so the browser's Back and Forward move between steps instead of leaving the wizard. A step not yet visited falls back to the furthest visited one; a reload (which loses the unsaved draft) starts again at Target.
  - On mobile the footer sits above the bottom nav, and the step header gets tappable chips for visited steps.
- **Dead ends and failures.**
  - With no step left to reach, the wizard shows a dedicated state explaining why, with a link back to the event.
  - The clear-estimates state says which data is missing.
  - After a partial failure, Retry failed stays available and leaving asks first ("Some items failed").
- The tour is updated to the new targets (the cards, the Assumptions panel, the summary, the footer) on desktop and mobile.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `legendary-event-plan-wizard`:
  - The step contents (Target, Upgrades, Teams, Runs and tokens, Review) change.
  - The layouts gain the plan summary and the step in the URL.
  - The data states gain "nothing left to reach" and the partial-failure leave prompt.
  - Creation gains named removals, counted Create and a pluralised toast.
  - The tour targets change.

## Impact

- `pages/legendary-events/ui/plan-wizard/`: `plan-wizard.tsx`, `plan-wizard-page.tsx`, `target-step.tsx`, `upgrades-step.tsx`, `teams-step.tsx`, `runs-step.tsx`, `review-step.tsx`, `use-plan-draft.ts`, `plan-wizard.tutorial.tsx`, plus new `plan-summary.tsx` and `target-card.tsx`, and the tests.
- `features/legendary-event-tokens`: `TokenPlanList` and `RunForecastSection` take an optional open-state key and `defaultOpen`, and an option to skip their expand analytics. Their public API stays backwards-compatible.
- Reuses `TeamEditorDialog` from `@/features/legendary-event-plan`; no new dependencies, no API change, no companion `tacticus-planner-api` change.
- New and changed copy in `apps/web/public/locales/{en,de,es,fr}/legendaryEvents.json` (`planWizard.*`, `tour.planWizard.*`).
- Lands after `speed-up-legendary-event-plan-wizard` (same files; that change's `targetSettled` drives the summary's and Upgrades step's "final" state).
