# Tasks

## 1. Accessible checkboxes and focus (D6, D7)

- [x] 1.1 Give every goal-dialog checkbox an `id`, and point its `FieldLabel` at it with `htmlFor`. This covers the goal-type selector, the prerequisite suggestions, and the footer and acquisition-source checkboxes. Give each label row `min-h-11` on mobile. Verify with a test that clicking the "Ascension" label text checks it, and that `getByRole("checkbox", { name: "Ascension" })` resolves.
- [x] 1.2 Give the project chip's remove control a hit area of at least 24×24px. Verify with a test that asserts the class, and by measuring it in the browser.
- [x] 1.3 In `packages/ui`, replace `ring-3 ring-ring/30` focus styles with a solid 2px ring plus offset on Checkbox, SelectTrigger, Button, Input and Textarea. Verify that the `packages/ui` tests pass, and that the measured ring contrast is ≥3:1 on card and background in both themes.

## 2. Validation issues list (D1)

- [x] 2.1 Change `use-goal-validation-state.ts` to return ordered `issues` keyed by kind and field. Include the slot conflict and target-reached issues. Derive `canSubmit` from it. Verify with unit tests: several issues at once (Rank conflict plus Upgrade with no material) are reported together, in card order.
- [x] 2.2 Render each issue inline in its card under its control, with `aria-invalid` and `aria-describedby`, and remove the bottom `create-goal-validation-error` line. Keep the `create-goal-slot-conflict` testid on the inline message. Verify with `create-goal-sheet.test.tsx`, updated for the new placement and the accessible description.
- [x] 2.3 Add `GoalFormIssueSummary` beside the submit button. It shows the count and its items scroll to and focus their field. Verify with a test that activating an item focuses the Rank target trigger.
- [x] 2.4 Upgrade quantity rows in create:
  - no silent clamp;
  - inline error for an empty value, or a value below 1 or above 10,000;
  - a non-blocking "already met" warning when the target is at or below the owned count;
  - the "own N" caption.

  Verify with tests for a cleared field, 0, and quantity 10 with 13 owned.

- [x] 2.5 In edit, show the Upgrade quantity error on the offending row, marked invalid. Verify with a `goal-edit-dialog.test.tsx` case that clears one of two quantities.

## 3. Defaults, taken targets and target options (D2, D3)

- [x] 3.1 Add `firstFreeTarget(kind, start, takenKeys)` beside the slot pre-check, and use it for the Rank, Ascension and Ability defaults when a type is enabled or the unit changes. Never override a target the user picked. Verify with unit tests:
  - Ascension next step;
  - Rank skips Gold III and Diamond I and picks Diamond II;
  - all targets taken falls back to the next step with a conflict.
- [x] 3.2 Mark taken targets in the create pickers as disabled options labelled "Already a goal". Verify with a test against an in-flight Gold III Rank goal.
- [x] 3.3 Add `progressionEndOptionsFor` and `abilityLevelOptionsFor`, which offer only targets above the start and keep a stored out-of-range value. Use them in the create cards and in `GoalTargetFields`, and drop "None". Verify with unit tests, and with edit and create tests for the Ascension picker's first option.
- [x] 3.4 Disable Unlock when an in-flight Unlock goal exists. The hint has an Open action that opens that goal, and no Unlock prerequisite is suggested. Verify with a test using a locked unit with an Unlock goal.
- [x] 3.5 Choose unit-kind copy for the "already unlocked" and other unit hints (Machine-of-War variants). Verify with a test for an owned MoW.

## 4. Edit dialog fixes (D4, D5)

- [x] 4.1 Feed the draft Rank target into the edit `FarmingStrategyField`. Verify with a test that changes the target from Gold I to Diamond I and asserts the preview range and checkpoint count.
- [x] 4.2 Add `headerAction` to `GoalEditDialog` and pass `<PageTourButton />` from `goals-page.tsx`. Verify with a test that the button renders inside `goal-edit-dialog`, and run `pnpm --filter web build` plus the bundle-budget script.
- [x] 4.3 Hide "Started from" when there is no start value, and label the ability tracks ("Primary 48 · Secondary 26" / "Active … · Passive …"). Verify with tests for an Upgrade goal with no range and a MoW Ability goal.
- [x] 4.4 Show an empty state in the farming-locations section when no location applies. Verify with a test for a goal whose location list is empty.

## 5. Sources, previews and review (D9)

- [x] 5.1 Skip shard locations that are missing from the battle catalog. In edit, keep saved unknown ids in the selection and show them as disabled "Unknown node" rows. Verify with tests against the `acquisition-source-field` and `use-goal-edit-acquisition` fixtures, using a missing battle id.
- [x] 5.2 Render "Every day" for all-week availability and for rotating-slot weekdays. Verify with an `acquisition-source-field.test.tsx` case.
- [x] 5.3 Show the "cheapest node will be used" note when Campaigns is selected with no node checked, in create and edit. Verify with a test.
- [x] 5.4 Give every preview section a loading, failed, not-applicable or content state. Fix the empty MoW Ability "Resources needed" box. Verify with a test for the Exorcist Ability 1→2 preview.
- [x] 5.5 Review list:
  - each goal with its start → target, in card order;
  - prerequisites marked;
  - an "estimate appears once the problems are fixed" message while issues exist;
  - a labelled project estimate.

  Verify with tests for two goals and for an invalid form.

- [x] 5.6 Merge the repeated Ascension "Resources needed" lines into one line. Verify with the updated `goal-farming-fields.test.tsx`.

## 6. Edit estimate and Upgrade materials (D11, D12)

- [x] 6.1 Show the draft-target estimate in the edit dialog for Rank, Ascension, Ability and Upgrade goals, using `estimateGoal` and the preview states from 5.4, and none for Unlock. Verify with tests: Arjac Gold I → Diamond I changes the estimate; an Unlock goal shows none.
- [x] 6.2 Add per-row remove (unavailable on the last row) and "Add material" via the create upgrade picker to edit's Upgrade rows; submit the whole list. Verify with `goal-edit-dialog.test.tsx` cases for add, remove, and the last row.

## 7. Layout (D8, D10)

- [x] 7.1 Mobile footer:
  - only Close and Create goal, in one row;
  - "Create paused" and "Create another goal" move into the body above the review on mobile, and stay in the footer on desktop.

  Verify with a `create-goal-sheet.test.tsx` case for each viewport (`useIsMobile` mocked).

- [x] 7.2 Add a mobile collapsible one-line current-status summary, collapsed by default. Verify with a test that it expands on activation.
- [x] 7.3 Scroll a newly enabled card into view without moving focus. Verify with a test that `scrollIntoView` is called on the new card and focus stays on the checkbox.
- [x] 7.4 Desktop polish:
  - give edit target selects `max-w-xs`;
  - widen the upgrade picker popover;
  - render current values in type cards as plain text.

  Verify with the screenshots in 9.x.

- [x] 7.5 Desktop fixed height (D14): add `desktopClassName` to `ResponsiveDialog` and pass the fixed height from the create sheet. Verify with a browser check that the dialog's top edge and height are unchanged after enabling the first and then a fourth type.
- [x] 7.6 Two panes at `@2xl` (D14): a main column with the selector, an empty state and the cards; a sticky side column with `UnitInfoCard` and the review, including per-goal cost lines. Verify with a test for the empty state, and with a browser check that the side column stays in view while the main column scrolls.
- [x] 7.7 Accordion cards (D15): `expanded`/`summary` on `GoalTypeCard`, and `expandedKind` in the form; enabling expands the new card and collapses the rest; the header button has `aria-expanded`; the summary line shows start → target and the issue count; the issue summary expands before focusing. Verify with tests for enable, header toggle, a collapsed card's issue count, and the summary following an issue into a collapsed card.

## 8. Tours and i18n

- [x] 8.1 Update `create-goal-sheet.tutorial.tsx`:
  - add an issue-summary step on desktop and mobile;
  - point the mobile status step at the summary's testid.

  Update `goal-edit-dialog.tutorial.tsx` if its targets moved. Add or update the `tour.*` keys in en/de/es/fr. Verify with the updated `.tutorial.test.tsx` files.

- [x] 8.2 Add every new or changed UI string to `apps/web/public/locales/{en,de,es,fr}/common.json`, with real de/es/fr translations:
  - issues summary, "Already a goal", "own N", the "already met" warning;
  - the Unlock existing-goal hint, MoW variants;
  - the "Started from" track labels, empty states, "Unknown node";
  - "Every day", the cheapest-node note;
  - review ranges and the estimate labels;
  - the mobile status summary;
  - the empty state, card summaries and issue counts.

  Verify with the i18n key-parity check (or `pnpm test:run`) and no English text in the de/es/fr files.

## 9. Desktop verification (≥768px, 1280×880, signed-in Aspire stack)

The data states come from the current local account:

- Incisus has Rank goals at Gold III and Diamond I;
- Morvenn Vahl has an Unlock goal;
- the Exorcist is an owned MoW;
- Arjac has a Rank goal;
- Toth has an Ascension goal;
- Z'Kar has a MoW Ability goal;
- Shiron has an Upgrade goal.

- [x] 9.0 Layout: enabling the first type does not move or resize the dialog; with four types the side column stays in view; only the newest card is expanded, and the others show summary lines.
- [x] 9.1 Create the Incisus goals:
  - Ascension defaults to the next step;
  - Rank defaults to Diamond II;
  - Gold III and Diamond I show "Already a goal";
  - two issues show inline and in the summary at once;
  - the summary moves focus.
- [x] 9.2 Create the Morvenn Vahl goal: Unlock is disabled with Open, no "ASE22", and the review lists ranges.
- [x] 9.3 Create the Exorcist goal: MoW wording, the Ability resources state, upgrade quantity "own N" and its warning or error, and the picker shows full names.
- [x] 9.4 Edit Arjac: the strategy preview follows the target, and the tour button starts the edit tour. Edit Toth: no options below the start, and the cheapest-node note. Edit Z'Kar: labelled start and the locations empty state. Edit Shiron: no "Started from", and the row-level quantity error.
- [x] 9.5 Keyboard: tab through the create dialog, and confirm the focus ring is visible on every control in dark and light themes. Take screenshots of Home, Goals and Dailies to review the app-wide ring change.

## 10. Mobile verification (<768px, 390×780 same-origin iframe)

- [x] 10.1 Create sheet: confirm `innerWidth` < 768, the one-line status summary, the goal types visible without scrolling, and each label row's hit area ≥44px tall, toggled by tapping the label text.
- [x] 10.2 Enabling Rank scrolls its card into view. The footer is one row (Close, Create goal), and "Create paused" and "Create another goal" sit above the review.
- [x] 10.3 Run the create-sheet tour and the edit-dialog tour on mobile, and confirm every step resolves its target.

## 11. Notes and priority at creation (D13, blocked on the API change)

- [x] 11.1 Propose and land the companion `tacticus-planner-api` change: optional `notes` per `CombinedGoalSpec` and optional request `position`, with API tests for insertion order and notes validation. Regenerate `schema.d.ts`.
- [x] 11.2 Switch `GoalEditNotesField` to `useId()`, and add a collapsed "Add note" disclosure per type card in create. Verify with a test that two goals get separate notes.
- [x] 11.3 Add the priority select (default last) to the create footer options, desktop footer and mobile body, reusing `GoalEditPriorityField`. Send `notes` and `position` from `use-goal-submission.ts`. Verify with tests for the request body and the default.
- [x] 11.4 Desktop and mobile: create two Incisus goals at the top with a note on one, and confirm the Goals list order and notes.

## 12. Gates

- [x] 12.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check` and confirm all pass. Confirm the bundle budget passes after 4.2 and 6.1.

## Verification notes

- 9.1: by the time of verification the account's Incisus held in-flight Rank goals at every rank from Gold III to Adamantine II, so its Rank default correctly fell back to Gold III with the inline slot conflict, and every taken option showed "Already a goal". The skip itself was verified on Thaddeus (Gold I, Gold II taken → Gold III) and Re'vas (Diamond II, Diamond III taken → Adamantine I).
- 9.4 / 10.3: the edit tour started the Goals page tour when the dialog was opened from `?goal=`; fixed in `shared/tour` (registrations keep their slot, dialog and sheet registrations rank above pages).
- 11.4 test goals (Incisus): Ascension → Legendary ★★★★ and Ability 36/36 (desktop, note "VERIFY polish-goal-dialogs (desktop)" on Ability), Ascension → Legendary ★★★★★ and Ability 37/37 (mobile, note "VERIFY polish-goal-dialogs (mobile)" on Ascension), each pair created at priority 1.

## Workflow follow-up

- Open the PR. CI must be green, including the bundle budget.
- Sync the specs and archive the change after merge.
- Delete the workspace-root `goals-dialog/` folder (audit and screenshots) once the change is implemented.
