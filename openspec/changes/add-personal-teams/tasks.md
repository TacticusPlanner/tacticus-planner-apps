## 1. Contract and entity

- [x] 1.1 Confirm the companion `tacticus-planner-api` change is applied, regenerate `shared/api/schema.d.ts`, and verify `pnpm typecheck` sees the teams endpoints and the import `teams` fields.
- [x] 1.2 Add `entities/team` API calls and TanStack queries with a public `index.ts`, and verify API and query tests cover list, create, update, delete and reorder, including the `409` responses.
- [x] 1.3 Add `TeamMode`, `evaluateTeamRules` and `useTeamRuleFacts`, and verify unit tests cover every rule code using the API spec's scenarios, including the Rukkatrukk, two-Incursion and core-character-as-flex cases.

## 2. Teams page

- [x] 2.1 Add the `teams` route to `protectedRoutes`, the Teams child in `nav-items.ts` after Incursions with `anonymousAllowed: false`, and localized labels, and verify navigation tests for section order, anonymous visibility and search.
- [x] 2.2 Wire the page into `PageHeader` and `PageToolbar` with a one-line description, the Mode select in Find and Create team in Actions, and verify a test for the slots at desktop and mobile widths.
- [x] 2.3 Build the page and team card with loading, failure, empty and no-roster states, core and flex sections, locked marks and issue reasons, and verify component tests for each state.
- [x] 2.4 Add the Mode select with its no-match state, remembered per device with the shared quick-filter storage, and verify tests for filtering, for the mode being restored on return, and for a page that renders when storage is unavailable.
- [x] 2.5 Add reordering by drag and move actions, with filtered-slot ordering, rollback and stale handling, and verify a test for the A, B, C to C, B, A scenario plus a failed and a stale save.
- [x] 2.6 Add delete with `ConfirmationDialog` and the 20-team limit on Create team, and verify tests for cancel, confirm and the limit message.

## 3. Team editor

- [x] 3.1 Add the `features/team-editor` draft model with add, remove, core and flex behavior, and verify unit tests for flex ordering and a null `flexStartIndex`.
- [x] 3.2 Build `TeamEditorDialog` with its desktop dialog and mobile sheet, name, notes and mode controls with visible reasons, opened through a page-held store as in #620, and verify component tests at both forms using `useIsMobile`.
- [x] 3.3 Add Campaign behavior: the 15 options, core character replacement and locking, faction limits and the allowed-factions text, and verify tests that Elite is not offered and that changing campaign replaces the lineup.
- [x] 3.4 Add Incursion behavior: compatible MoW choices, the shared faction limit, the lineup clear and the allowed-factions text, and verify tests for Rukkatrukk.
- [x] 3.5 Build the unit picker with search, the Filters button and its badge, every filter, the "Locked units" chip and V1's sort, with portraits at the rule 6 sizes, and verify tests for each filter, MoW filter handling and the no-roster state.
- [x] 3.6 Add the same-mode flag for units in other teams, and verify the flagged, not-flagged and still-selectable scenarios.
- [x] 3.7 Add the rarity cap with V1's caps, and verify the Epic worked example and that no cap is saved.
- [x] 3.8 Handle save results: close on success, keep the draft on failure, stale reload, `teamNameTaken` and server rule codes through an exhaustive `Record<TeamRuleCode, …>` copy map, and verify a test for each.
- [x] 3.9 Show how to fix each issue, and mark the characters concerned for `factionNotAllowed` and `coreCharacterMissing`, and verify the Rukkatrukk Sisters of Battle scenario.

## 4. V1 import

- [x] 4.1 Add `teams` to `V1_IMPORT_PARTS`, the account default `false` and the onboarding default `true`, and verify the existing dialog tests plus a test for both defaults.
- [x] 4.2 Add `team-outcome-buckets.ts` and the result rendering with translated part reasons and issues, and verify tests for the four buckets, each outcome and issue code, and no raw code being shown.
- [x] 4.3 Invalidate team queries in `refreshAfterImport`, and verify a test that the Teams view refreshes after an import.

## 5. Tour and copy

- [x] 5.1 Add `teams.tutorial.tsx` registered through `useTourPageSteps`, with desktop and mobile steps and `tour.teams.steps.*` keys, and verify a tutorial test on a populated and an empty list.
- [x] 5.2 Add the `teams` namespace to en, de, es and fr, register its resource type, and verify the locale tests pass with real translations in every file, including rule, outcome and tour copy.
- [x] 5.3 Add the navigation and `goals.v1Import` keys to `common.json` in every locale, and verify real translations and the description copy test.

## 6. Shared verification

Required data: one account with no teams, and one with 20 teams covering every mode, a flagged imported team and no synced roster on a separate account. A V1 test account with `teams2` data is required for 6.3.

- [x] 6.1 Against the Aspire stack, verify create, edit, delete and a stale save from two tabs persist through the API.
- [ ] 6.2 Verify a Campaign and an Incursion team save, and that an API refusal for a broken rule shows translated reasons.
- [ ] 6.3 Run a V1 import with Teams selected, then re-run it, and verify imported, needed-no-import and flagged outcomes, with existing teams unchanged.

## 7. Desktop verification (viewport at or above 768px)

- [x] 7.1 Verify the My Game section menu order, the page states on the populated and empty accounts, and drag and keyboard reorder under a filter.
- [x] 7.2 Verify the editor dialog with lineup and picker visible together, the Filters popover, rarity cap and mode reasons, and that it opens without a noticeable delay on the 20-team account.
- [ ] 7.4 Check the page against the `ui-style-guide` review checklist and attach desktop screenshots to the PR.
- [x] 7.3 Verify the tour on the populated and empty accounts.

## 8. Mobile verification (viewport below 768px)

Emulate with a same-origin 420px iframe and confirm mobile UI renders, following `tp-manual-ui-verification`.

- [x] 8.1 Verify the drawer and header tab row list six My Game children, and the page states on the populated and empty accounts.
- [x] 8.2 Verify move actions by touch and the editor sheet with stacked lineup, the Filters sheet, visible mode reasons and 48px touch targets.
- [ ] 8.4 Attach mobile screenshots to the PR.
- [x] 8.3 Verify the tour on the populated and empty accounts.

## 9. Gates

- [x] 9.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`, and verify all pass.

## 10. Contract and rules: MoW roles and the saved cap

- [x] 10.1 Pull the API contract with `mowFlexStartIndex`, `rarityCap` and `tooManyCoreMows`, and verify `pnpm typecheck` fails until the copy map has the renamed code.
- [x] 10.2 Extend `evaluateTeamRules`, the draft model and the lineup sections for MoW roles and auto-placement, and verify unit tests for the three MoW scenarios, a full core sending a character to flex, and an all-flex MoW team.
- [x] 10.3 Save and load the rarity cap with the team, and verify the "The cap is saved" scenario.

## 11. Page redesign

- [x] 11.1 Persist the layout and grouping per device beside the mode, and verify defaults, a round trip, storage unavailable, and Table showing as List on a phone.
- [x] 11.2 Add status chip selectors (rule errors, shared units within a Guild War mode, under-cap counts) and `StatusChip`, and verify chip order, one fact per chip and the shared-only-within-a-Guild-War-mode scenarios.
- [x] 11.3 Rebuild the toolbar (search over names and units, Mode, the two quick-filter chips hidden at 0, Group by, layout, Reorder, count, Create team), and verify filter combinations, the no-match reset and the 20-team limit.
- [x] 11.4 Build the cards view and the mode sections, and verify first-mode grouping, skipped empty modes and the "More actions" menu.
- [x] 11.5 Build the table view, and verify empty core slots, an empty status cell and a flagged row.
- [x] 11.6 Build reorder mode on the Goals `SortableList` grid, with the status line and move buttons, and verify keyboard pick-up, move, drop and cancel, disabled ends, rollback on failure, filtered reorder and grouping restored after Done.
- [x] 11.7 Build the phone page (two-row toolbar, cards and list), and verify 48px targets under a coarse pointer.

## 12. Editor redesign

- [x] 12.1 Extract `UnitTile` from the picker tile, keeping the check mark, focus ring, one Tab stop and arrow keys, and verify states and accessible names (picked, shared, locked).
- [x] 12.2 Add the desktop sheet variant to `ResponsiveDialog` and move the editor into it (header, team settings with the mode `ToggleGroup` and the cap, sticky lineup band with slot menus and drag, picker, footer), and verify the lineup band stays in view, focus order and the unsaved-changes guard.
- [x] 12.3 Add the editor states (new team reasons, the rule-broken box with marked units, saving, save failed, stale, name taken), and verify each.
- [x] 12.4 Build the phone editor tabs (Lineup rows with Core and Flex for characters and MoWs, Characters, Machines of War) with live counts and add or remove messages with Undo, and verify Undo restores role and position.

## 13. Tour, copy and motion

- [x] 13.1 Update the tour to cover grouping, Create team, a team and reorder mode in both layouts and on a phone, and verify a populated and an empty list.
- [x] 13.2 Add the new copy in en, de, es and fr, one fact per chip and button, and verify the translation tests.
- [x] 13.3 Honor reduced motion for the sheets, slot adds and reorder drops, and verify the animations are skipped.

## 14. Verify the redesign

- [ ] 14.1 Against the Aspire stack, verify both layouts, grouping, drag reorder, status chips and the saved cap on the 20-team account, on desktop with both navigation panels open and on a phone.
- [ ] 14.2 Verify the editor sheet and the phone tabs, including a V1 team with two MoWs importing with the second as flex.
- [x] 14.3 Check the page and editor against the ui-style-guide checklist and an accessibility pass (keyboard run-through, chip contrast in both themes).
- [x] 14.4 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`, and verify all pass.

## 15. Feedback round: realistic teams

- [x] 15.1 Replace `noUnits` with `tooFewCharacters` (at least 3 characters in every mode; MoWs do not count) from the regenerated contract, with a counted fix ("Add 1 more character.") and chip in en, de, es and fr, and verify the rule and editor tests.
- [x] 15.2 Flag shared units only within War Offense or within War Defense (page chips, the section note, the picker's "Also in"), and verify that offense and defense, and two Horde teams, do not clash.
- [x] 15.3 Show notes and the Campaign or Incursion line on cards, table rows and phone rows again, and verify both on a card.
- [x] 15.4 Give the table fixed column widths so every mode section lines up, and drop the cap from the row's second line (it is a chip).
- [x] 15.5 Make Reorder and Create team labelled icon buttons on a phone so the search keeps its row, and verify at 390px.

## 16. Review follow-ups

- [x] 16.1 Name every shared unit in a Guild War section's note ("2 units shared", the names on hover), and verify it.
- [x] 16.2 Leave a section's own mode off its cards and rows, and verify a card shows only its other modes.
- [x] 16.3 Make notes on cards smaller and italic, the table's Machines of War header plural, and the empty core slots visible on dark and tinted rows.
- [x] 16.4 Hide Flex on a team's only core character (a team keeps one), in the band and the phone rows.

## 17. Feedback: dialog editor and Goals-style reorder

- [x] 17.1 Open the editor as a large centered dialog on desktop again (the right-hand sheet is dropped), keeping the header, band and picker layout, and verify it.
- [x] 17.2 Remove the Reorder button and reorder mode: every card, table row and phone row shows its position and a drag grip at its top left, as Goals cards do, and drags move teams among the shown teams' positions; verify keyboard pick-up, cancel, menu moves, rollback and stale.
- [x] 17.3 Replace the "More actions" menu with Edit and Delete icon buttons on every card, table row and phone row (moves are by the grip), let card names wrap to two lines, and verify Edit, Delete and drops through the drag list.
- [x] 17.4 Accessibility pass fixes: amber text one step darker in light mode (4.45:1 to 6.3:1), the quick-filter chips named "Quick filters", and the card name taken out of the tab order (Edit is its keyboard twin).
- [x] 17.5 Phone touch pass (touch styles forced on at 390px): card grip, Edit and Delete 48px; Save 48px and the editor tabs 40px plus the shared tap margin; ability levels moved under the name in the phone lineup rows so names are not cut.
- [x] 17.6 Show each lineup unit's role as a Core/Flex switch with both labels (Flex unavailable for a team's only core character or a campaign's core), make the empty Flex drop area a centered dashed box, and verify on desktop and at 390px.
- [x] 17.7 As on Goals, a card, table row or phone row opens nothing on tap; Edit is the way into the editor (no stray opens on a phone), and verify a tap on the card leaves the editor closed.
