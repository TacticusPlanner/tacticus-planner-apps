# Design

## Context

See proposal.md (Why). Evidence and screenshots are in the workspace's `goals-dialog/ux-audit.md`.

Relevant current state:

- **Create form** (`features/goal-create`):
  - `useCreateGoalForm` composes per-type field hooks (`useAscensionFields`, Rank/Ability/Upgrade hooks).
  - It exposes one `validationMessage` (the first failing rule) plus a separate `slotConflictMessage`.
  - `UnitGoalFormFields` renders the type cards; `GoalTypeCards` holds one `switch` per kind.
  - Validation logic lives in `use-goal-validation-state.ts`.
  - The slot pre-check uses each type's target key (`goal-creation` "The slot pre-check compares each goal's target").
- **Edit form:**
  - `GoalEditForm` holds a `GoalEditDraft`.
  - `GoalEditFarmingFields` builds the rank strategy preview from `detail.config.rank`. That is the cause of the stale preview.
  - `GoalTargetFields` filters only Rank options (`rankEndOptionsFor`); `GoalTargetStart` returns `null` for Upgrade.
- **Shared UI:**
  - `GoalTypeToggleGroup` renders `Checkbox` plus `FieldLabel` with no `htmlFor`.
  - `@workspace/ui` `Checkbox` and `SelectTrigger` use `focus-visible:ring-3 ring-ring/30`.
  - `Checkbox` already extends its hit area with an `after:` inset.
- **Tour button:** after #289, `CreateGoalSheet` takes a `headerAction` from `app-shell.tsx`, which keeps `PageTourButton` out of the lazy chunk's import graph. `GoalEditDialog` has no such prop.

## Goals / Non-Goals

**Goals:**

- Fix the behaviours listed in the specs, with tests at the model level wherever the logic isn't purely visual.
- Keep create and edit on shared components where both show the same thing: target options, quantity rows, empty states.

**Non-Goals:**

- Anything listed as "Not in scope" in the proposal.
- One shared form for create and edit, the visual target picker and the mobile step-by-step flow. They are in the follow-up change `unify-goal-composer`.
- Changing estimate maths.

## Decisions

### D1. Validation becomes a list of issues keyed by field, not a single message

`use-goal-validation-state.ts` returns `issues: { kind: GoalKind | "form"; field: string; message: string }[]`, ordered by card order. The slot conflict becomes one more issue (`field: "target"`), so it is no longer a separate prop.

- Each card renders its own issues under the matching control, with `aria-invalid` and `aria-describedby` via a stable id built from `kind` and `field`.
- A small `GoalFormIssueSummary`, rendered next to the submit button inside the footer, shows the count. Its items call `scrollIntoView` and then `focus()` on the field's element, found through a ref map keyed the same way.
- `canSubmit` becomes `issues.length === 0`.

_Alternative:_ keep a single message and only move it next to the submit button. Rejected: the user still finds problems one at a time, and that is the core complaint.

### D2. Default targets are computed from the in-flight goals the slot check already loads

One pure helper, `firstFreeTarget(kind, start, takenKeys)`, lives beside the slot pre-check. It walks the kind's ordered target list above `start`.

- It returns the first target whose key is not in `takenKeys`, or else the first target above `start`.
- The per-type hooks call it when a type is enabled and when the unit changes. A value the user has picked themselves is never replaced.
- The same `takenKeys` set feeds the pickers' disabled "Already a goal" options.

_Alternative:_ default to the next step and only show the conflict. Rejected: users with imports and ladders hit the conflict almost every time.

### D3. One target-options function per kind, shared by create and edit

`target-edit/goal-target-edit.ts` already has `rankEndOptionsFor`. Add `progressionEndOptionsFor` and `abilityLevelOptionsFor`, all "above start, plus a stored out-of-range value if present", and use them in both `GoalTargetFields` (edit) and the create cards. "None" is dropped from progression pickers.

### D4. Edit's strategy preview reads the draft

`GoalEditFarmingFields` receives the draft Rank target (`end`, `additional`) from `GoalEditForm` and passes it to `FarmingStrategyField`. It no longer reads `detail.config.rank.end`; the start still comes from `detail`.

### D5. Tour button for edit uses the same injection as create

`GoalEditDialog` gains `headerAction?: ReactNode`. Its only host, `pages/goals/ui/goals-board/goals-page.tsx` (which also serves Project Detail), passes `<PageTourButton />`. This keeps both dialogs on one pattern and avoids pulling the tour into lazy chunks. The bundle budget is checked in CI.

### D6. The focus ring is fixed in `@workspace/ui`, not per dialog

Change `focus-visible:ring-ring/30` to a solid 2px ring (`ring-2 ring-ring` plus `ring-offset-2 ring-offset-background`) in `Checkbox`, `SelectTrigger`, `Button`, `Input` and `Textarea`.

- This is a deliberate app-wide change: a per-dialog override would leave every other page failing the same criterion.
- The 3:1 contrast is measured against card and background tokens in both themes.

_Alternative:_ scope the override to the dialogs. Rejected as inconsistent focus styling across the app.

### D7. Label rows become the hit target

`GoalTypeToggleGroup` and the prerequisite and footer checkboxes give each `Checkbox` an `id` and point their `FieldLabel` at it with `htmlFor`. On mobile the label row gets `min-h-11`. The chip remove control gets an `after:` inset like `Checkbox`.

### D8. Mobile layout split

The difference is structural, so it is a decision rather than reflow:

|                                           | Desktop (≥768px)        | Mobile (<768px)                                    |
| ----------------------------------------- | ----------------------- | -------------------------------------------------- |
| "Create paused" and "Create another goal" | footer                  | body, above the review                             |
| Footer                                    | options and two buttons | one row: Close, Create goal                        |
| Current status                            | full status card        | collapsible one-line summary, collapsed by default |

- `useIsMobile()` picks the placement.
- A newly enabled card is brought into view in both layouts, with `scrollIntoView({ block: "nearest" })` on the card ref after the toggle. It mostly matters on mobile.
- **Tour:** the create-sheet tutorial's mobile steps target the summary's `data-testid` instead of the full status card, and gain a step for the issue summary. Desktop steps also gain the issue-summary step.

### D9. Unknown nodes and wording

- `GoalShardLocationsField` skips locations with no `battlesById` entry. The edit acquisition seed keeps saved unknown ids in the submitted selection and shows them as disabled "Unknown node" rows.
- Weekday lists equal to all seven days render the "every day" key.
- Unit-kind copy uses an `_mow` key variant chosen by `entityType`.

### D10. Layout polish stays in the components, without spec requirements

The remaining polish is visual only, so it is covered by tasks and screenshots, not specs:

- Edit target selects get `max-w-xs`.
- The upgrade picker popover uses `w-(--radix-popover-trigger-width) min-w-80`.
- The repeated Ascension "Resources needed" lines are merged into one line.
- Current values in type cards render as plain text instead of input-shaped boxes.

### D11. Edit estimate reuses the create preview's engine

`GoalEditForm` builds the same preview input the create form builds for one goal, from `detail` (start, unit, farming preferences) plus the draft target, and calls `estimateGoal` from `features/goal-farming/@x/goal-create`. No new estimate code. It renders below the farming preferences with the same loading, failed and content states as the create preview (5.4). Unlock shows none, matching its missing target section.

### D12. Edit reuses the create upgrade picker for adding materials

The Upgrade rows in `GoalTargetFields` gain a remove control per row, unavailable on the last row, and an "Add material" trigger that opens the create dialog's upgrade picker popover, scoped to the goal's unit. The draft's `upgrade.targets` list is submitted whole; the API already replaces the list (`goal-target-editing`).

### D13. Notes and priority at creation go in the create request

- **API (companion change, lands first):** `CombinedGoalSpec.notes?: string | null`, validated like goal details' notes, and `CreateCombinedGoalsRequest.position?: number | null`, from 1 to in-flight count + 1, inserting the batch there in spec order. A null position appends, as today.
- **Apps:** each type card gets a collapsed "Add note" disclosure holding the notes field. `GoalEditNotesField` is reused after its hard-coded `id="goal-notes"` becomes `useId()`, since create renders several. One priority select in the footer options reuses `GoalEditPriorityField` with `total = in-flight count + 1` and the last position as default.

_Alternative:_ create, then `PUT` notes and priority per goal. Rejected: not atomic, and n+1 requests.

### D14. Desktop: fixed height and two panes

Today the dialog is centred with `max-h` and grows with its content: the first enabled type takes it from about 375px to full height and re-centres it, which is the jump. `ResponsiveDialog` gets an optional `desktopClassName`. The create sheet passes a fixed `md:h-[min(56rem,calc(100vh-2rem))]`, so growth happens inside the scroll area and the dialog never moves.

`UnitGoalFormFields` at `@2xl` becomes `grid-cols-[minmax(0,1fr)_22rem]`:

- **main column (scrolls):** goal-type selector, empty state, cards;
- **side column (`sticky top-0`):** `UnitInfoCard` and the review, which gains per-goal cost lines from the existing previews.

Projects and prerequisite suggestions stay in the main column under the selector. Below `@2xl` (mobile, narrow windows) it stays one column, as today. Each card is then full width of the main column, so the half-width Ability card problem goes away without a `wide` flag.

### D15. Cards are an accordion with a summary line

`GoalTypeCard` gains `expanded`, `onExpandedChange` and `summary`. `useCreateGoalForm` holds `expandedKind`: it is set on enable and on header activation, and by the issue summary (D1) before it focuses a field. The header is a button (`aria-expanded`, `aria-controls`) with the icon, name, summary and issue count. A collapsed card keeps its state, since only the body is hidden. The header row gets a `bg-muted/50` band and a bottom border, so cards stay distinct even when expanded.

_Alternative:_ tabs per goal type. Rejected: tabs hide that several goals are being created at once.

## Risks / Trade-offs

- **[Risk]** The app-wide focus-ring change (D6) alters every page's look.
  → Review screenshots of Home, Goals and Dailies in both themes, in the same PR, and keep the change to the focus state only.
- **[Risk]** Default targets that skip taken ones (D2) could surprise a user who expects "next rank".
  → The taken targets are visible and disabled in the picker, so the reason for the default is readable.
- **[Risk]** Moving the slot conflict into the issues list (D1) could change existing tests' testids.
  → Keep `create-goal-slot-conflict` on the inline message and update the tests that assert on its position.
- **[Risk]** Notes and priority depend on the API change. → Tasks in group 11 are last and blocked on it; the rest of the change can ship without them.
- **[Risk]** A collapsed card hides a problem. → The issue count on the summary line, plus the issue summary, which expands the card.
- **[Trade-off]** Disabling taken targets (instead of keeping them selectable with "Open that goal") means a user can't jump from the picker to the existing goal. The Unlock hint keeps an Open action, and the edit dialog's collision error already offers "Open that goal".

## Open Questions

None that change the specs or tasks. The product questions left out of scope are listed in the audit.
