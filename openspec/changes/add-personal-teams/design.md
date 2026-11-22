## Context

See `proposal.md` for the motivation and the specs for the behavior. Companion change: `add-personal-teams` in `tacticus-planner-api`, which defines the `/api/v1/teams` contract, the rule codes and the V1 import `teams` part, and applies first.

Current state that shapes the approach:

- The LRE team editor and `TeamUnitPicker` live in `features/legendary-event-plan` and are built around lanes, objectives, clear depth and a five-member limit. FSD forbids one feature importing another.
- `entities/legendary-event` already exports `EventUnitChip`, `ownedUnitChipData` and `useLegendaryEventRoster`, none of which depends on a lane.
- `shared/ui` has `SortableList`, `ResponsiveDialog`, `ConfirmationDialog` and `RarityCombobox`.
- The catalog already serves what the rules need: campaign definitions with `coreCharacters`, campaign battles with `alliesFactions`, and `incursions` with `allowedFactions`.
- `V1_IMPORT_PARTS` is the single list of import parts, read by both the panel and the result.

## Goals / Non-Goals

**Goals:**

- Instant feedback on every rule, with the API as the authority.
- A team entity the later War Defense and War Offense pages can read without touching this page.

**Non-Goals:**

- War Defense, War Offense, War Zones and team sharing.
- Team filters on Collection, Roster Snapshots or guild rosters.
- Replacing the LRE editor or moving its picker.

## Decisions

### D1: FSD ownership

| Slice                    | Owns                                                                                                                             | Public API                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `entities/team`          | API calls, TanStack queries, types, mode list, `evaluateTeamRules`, issue copy keys                                              | `useTeams`, team mutations, `TeamMode`, `evaluateTeamRules`, `useTeamRuleFacts` |
| `features/team-editor`   | Draft model, `TeamEditorDialog` (sheet on desktop, tabbed sheet on a phone), lineup band, `UnitTile` picker, filters, rarity cap | `TeamEditorDialog`                                                              |
| `pages/my-game/ui/teams` | Page, toolbar, cards, table, mode sections, drag reorder, status chips, tour                                                     | Route only                                                                      |

War pages can later read `entities/team` directly. The editor is a feature because only this page opens it today.

### D2: A new picker rather than a generalised LRE picker

`features/team-editor` gets its own picker built from `EventUnitChip`, `ownedUnitChipData` and `useLegendaryEventRoster`. Generalising `TeamUnitPicker` would mean pushing objective, reserve, depth and goals-preview behavior behind options, and moving it to a shared slice, for a screen with different selection rules. The chip is the reusable part.

### D3: The client mirrors rules, the server decides

`evaluateTeamRules(draft, facts)` in `entities/team` returns the API's rule codes, so the editor and the card use one result. The codes come from the contract's `TeamRuleCode` enum, and the code-to-copy map is an exhaustive `Record<TeamRuleCode, …>`, so a code the server adds fails `pnpm typecheck` until it has copy. The API remains the authority: `issues` on a read are shown as sent, and a `400` with `issueCode` `teamRulesBroken` maps the codes in its `rules` array (typed `TeamRuleCode[]` on `ApiProblem`, not `errors`) onto the same copy. Rule tests use the API spec's scenarios, so the two sides are checked against one list. `useTeamRuleFacts` builds facts from `useCatalogDataset("incursions")`, campaign definitions and campaign battles.

A campaign's allowed factions come from any of its battles, because the served definition does not carry them and every battle in a group carries the same copy.

### D4: Campaign identity

The editor's campaign list is the non-Elite campaign groups, labelled from the existing `campaigns:names.*` keys, plus the Mirror difficulty for mirror groups. The saved value is the group id. Standard-and-mirror storylines reuse the existing `names`, so no campaign name is added.

### D5: Reordering under a filter

The page computes the complete new order by rewriting only the slots the visible teams hold, as V1's `Teams2` reducer does, then calls `PUT /api/v1/teams/order` with the full list. Moves use an optimistic cache update with rollback, matching the Goals board. `SortableList` covers drag; the move actions are explicit buttons, so keyboard and touch work on both forms.

### D6: Desktop and mobile split

The orchestrator pattern applies only to the editor: `TeamEditorDialog` holds the draft, and `useIsMobile()` selects the layout.

|                | Desktop (768px and up)                                                                                                                                                                                         | Mobile (under 768px)                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Editor         | A large centered dialog over the page (a right-hand sheet was tried and rejected: the player prefers the dialog); a lineup band stays in view above the picker, which shows characters and MoWs as two columns | Bottom sheet with Lineup, Characters and Machines of War tabs; adds and removes show a message with Undo |
| Picker filters | Search, a "Filters" button with an active-count badge opening the fields inline under the search (no overlay on top of the dialog), and the "Owned only" chip                                                  | The same                                                                                                 |
| Unit portraits | `sm` (40px) on cards, table rows and the lineup band, whose rows scroll sideways; `md` (64px) in the picker                                                                                                    | `sm` in the Lineup tab's rows; `md` in the picker (ui-style-guide rule 6)                                |
| Page layouts   | Cards or Table                                                                                                                                                                                                 | Cards or List; a saved Table shows as List                                                               |
| Tour targets   | `data-testid` on the page controls                                                                                                                                                                             | The same selectors                                                                                       |

The page itself is a responsive reflow, with no separate tree. It uses the shared `PageHeader` and `PageToolbar` (`app-page-layout`): search, the Mode select and the quick-filter chips in Find; Group by and the layout in View; the team count and Create team in Actions; no Settings. `ResponsiveDialog` gains a desktop sheet variant for the editor.

The open editor follows the pattern #620 introduced for the Legendary Event team editor: the page holds a small store with the team being edited, the editor mounts only while open, and the picker's unit list is derived once per open rather than on every draft change. Opening the LE editor took about 1 s before that change, and this picker covers the whole catalog.

### D7: Page state

The mode filter, the layout and the grouping are remembered per device in localStorage with `usePersistedSelection`, the helper the quick filters #638 moved off the URL use, because a Guild War player opens the page the same way each time. Editor filters live in the feature and reset when it closes; the rarity cap is part of the team and is saved with it.

### D8: Import part

`teams` joins `V1_IMPORT_PARTS` after `legendaryEventPlans`, so the panel and result pick it up. A new `model/team-outcome-buckets.ts` follows `legendary-event-outcome-buckets.ts`. `V1ImportPanel.refreshAfterImport` invalidates team queries when selected. The account page default is `false`; `setup-v1-import.tsx` defaults to `true`, matching Legendary Event teams.

### D9: i18n

A new `teams` namespace holds page, editor, rule and tour copy. Navigation labels stay in `common.json` under `myGame.tabs`, and import copy under `goals.v1Import`, beside their siblings. Every new key ships with real de, es and fr translations.

### D10: V1-parity checklist

| V1 item                                                | Decision                                                                                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/plan/teams2` route, Plan menu                        | Redesign: `/my-game/teams`, chosen by the user                                                                                                     |
| Icons                                                  | Redesign: V2's `gameMenuIcon`, `eventIcon`, `EventUnitChip`; no V1 asset ids reused                                                                |
| Add New Team, Edit, Delete with browser confirm        | Keep, as "Create team" in the toolbar's Actions slot, with `ConfirmationDialog` replacing the browser confirm                                      |
| Team Type filter                                       | Keep, as a labelled Mode select in the toolbar's Find slot, remembered per device                                                                  |
| Drag, arrow moves, `#priority` badge                   | Keep                                                                                                                                               |
| 20-team limit tooltip                                  | Keep                                                                                                                                               |
| Name, notes and duplicate rules                        | Keep, adding `teamNameTaken` from the server                                                                                                       |
| Mode checkboxes, disabled state and tooltips           | Keep; touch gets visible reasons, not tooltips alone                                                                                               |
| Size and exclusivity messages                          | Keep                                                                                                                                               |
| Campaign picker, "Usable:" hint, core-trio replacement | Keep; core characters become unremovable                                                                                                           |
| Incursion MoW picker, "Usable:" hint, lineup clear     | Keep; the rule uses allowed factions                                                                                                               |
| Rarity cap selector                                    | Redesign: saved with the team, shown on its card and row, and the lineup marks what is under it                                                    |
| Unit filter panel and sort                             | Keep, behind the standard "Filters" button                                                                                                         |
| Deployed marker for units in other same-mode teams     | Keep, with clearer wording                                                                                                                         |
| Zoom slider                                            | Drop: the chip scale is fixed                                                                                                                      |
| Resizable MoW column                                   | Drop: layout handles it                                                                                                                            |
| Import Legacy Team                                     | Drop: V1 legacy teams are out of scope                                                                                                             |
| Empty and load-failure states                          | Redesign: V1 has neither. The empty state is "No teams yet." with Create team, plus a secondary link to the V1 import for players arriving from V1 |

### D11: The layout handoff, adjusted to the style guide

The page and editor layout follow the agreed design handoff ("Teams layout directions", frames 1 to 10), with four changes so it keeps the ui-style-guide:

| Handoff                          | Built as                                                                                                                                                                                                             | Why                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| "Group by mode" on/off toggle    | "Group by" segmented control with None and Mode, in the View slot                                                                                                                                                    | Rule 3: Group by is always labelled and has a None option                                                         |
| Mode chips with `aria-pressed`   | A multi-select `ToggleGroup`                                                                                                                                                                                         | The checklist bans hand-rolled `aria-pressed` toggles                                                             |
| Picker as `role="grid"`          | The tested list of pressed buttons, one Tab stop, arrow keys                                                                                                                                                         | A wrapping tile list has no rows or cells for the grid role                                                       |
| A reorder mode with its own list | No mode and no Reorder button: each card and row shows its position and a drag grip at its top left, as Goals cards do, on the shared `SortableList`                                                                 | One drag, preview and keyboard model across pages, and nothing to switch into                                     |
| Lineup slot menus                | Each slot's role as a Core/Flex switch with both options always shown (the handoff's segmented control), Remove, and a drag grip; a sortable Flex divider splits core from flex (`arrangeCharacters`, `arrangeMows`) | Visible actions are found without opening a menu, and one drag model covers reorder and role on desktop and phone |
| Page "Filters" button            | No Filters button                                                                                                                                                                                                    | Search, Mode and the two quick-filter chips are the only filters the page has                                     |
| Reorder in the View slot         | No Reorder button; on a phone Create team is a labelled icon button                                                                                                                                                  | Dragging needs no mode, and the phone's first row keeps room for search                                           |

Edit and Delete are visible icon buttons on every card and row instead of the handoff's "More actions" menu, at the player's request: two actions do not need a menu, and moving is by the grip. The editor is a large centered dialog rather than the handoff's sheet, also at the player's request. The handoff's other choices (cards and table over one list, tabs over steps on a phone) are recorded in the handoff with what was rejected.

### D12: MoW roles and auto-placement

The draft mirrors the API's record: `mowIds` core first with `mowFlexStartIndex`, as characters use `flexStartIndex`. Adding a unit places it in core while the selected modes leave room and in flex otherwise, and says where it went: an animated slot on desktop, a message with Undo on a phone, where the lineup is not in view while picking. The editor never removes a unit to satisfy a rule.

## Risks / Trade-offs

- [The rule mirror drifts from the API] → Tests use the spec's scenarios, and a server `400` always shows translated reasons.
- [Catalog data is not loaded when the editor opens] → The editor shows a loading state; Save stays unavailable, because rules cannot be evaluated.
- [`useLegendaryEventRoster` is named for another feature] → It is reused as is. Renaming it is unrelated to this change.
- [`add-automatic-roster-snapshots` has merged and already added a part to the import screen] → This change merges second and adds `teams` after it in `V1_IMPORT_PARTS`.
- [The editor is slow to open over the whole catalog] → The #620 pattern in D6, and a check on open time in the verification tasks.

## Migration Plan

Merge after the API change. `schema.d.ts` must be regenerated from that contract first. There is no client data migration.
