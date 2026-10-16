# Design

## Context

The team editor (`features/legendary-event-teams/ui/team-editor-dialog.tsx`) is a `ResponsiveDialog` with a name field, a members section (`TeamUnitPicker`: search, Only unlocked, Goals Preview, a tile grid from `buildPickerTiles`), a coverage section, a depth section and a footer with Cancel and Save. `TeamEditorDialog` is mounted inside `teams-section.tsx`, one per lane tab, and already accepts `initialMemberUnitIds` (used by Use this team). The leaderboard rows' menu (`LeaderboardRowActions`) has one item, Create goal. V1's dialog is objective-first (`lre-add-team.tsx`): ticked objectives narrow and rank the available list (`suggestTeam`), "Add top 5" fills the team, the dialog is opened from the ranked grid, and Shift+click creates a team without a dialog. Owner decisions (2026-10-16): build objective filtering, the sticky footer, Save and add another and the leaderboard row action; not auto-fill, objective-chip entry or quick teams. See proposal.md.

## Goals / Non-Goals

**Goals:**

- Reach a good team with a few selections: pick objectives, pick the first units listed.
- Keep what the user needs to decide (count, coverage, depth, Save) in view.
- Build several teams in a row without reopening the editor.
- Start a team from the unit you are already looking at.

**Non-Goals:**

- Auto-filling a team or creating teams without the editor.
- Changing coverage derivation, depth defaults, naming or the five-member maximum.
- New persisted state (chip selection is session-local and resets on close).
- Re-ranking suggestions (their ranking is gain-based and untouched).

## Decisions

**D1. Chips reorder and dim, they never hide.** The V1 list narrows to matching units; hiding makes it impossible to add a unit that misses an objective deliberately (a reserve-like pick, or the user's only high-power unit). Matching units sort first by points per battle then name (the existing tie-breaks), non-matching ones follow dimmed. `buildPickerTiles` stays the single ordering function and gains an optional selected-objective argument; counts are computed from the same tiles after search and Only unlocked, so the chip number equals what the grid will list first.

**D2. The footer is a summary, the body keeps the controls.** The footer repeats read-only coverage chips, the count, the depth line and the actions; unticking objectives and the depth stepper stay in the body (moving them would duplicate controls and complicate focus order). If `ResponsiveDialogFooter` already stays pinned the work is content only; the tasks check it first. Alternative: a two-pane desktop layout (picker left, summary right). Rejected for now: it needs a different mobile form anyway and the sticky footer solves the reported pain with less layout risk.

**D3. Save and add another resets the draft, not the context.** It saves, then replaces the draft with an empty one for the same lane (name unset so the derived default returns, depth null) while the chips, Only unlocked, search text and Goals Preview survive, and focuses the search field. The team list behind the dialog updates through the existing plan write. After a conflict or error the draft stays, like Save. It exists only for a new team.

**D4. One editor instance at the event page, opened through a launcher.** The Overview leaderboard has no Teams section, so the editor moves out of `teams-section.tsx` into a page-level host exposing `openTeamEditor({ laneId, memberUnitIds?, team? })`. The Teams section's Add team, Edit and Use this team call it; so do the leaderboard menus. FSD: the page owns the host and imports the teams feature; the leaderboard components receive callbacks from the page and do not import the teams feature. Alternative: keep one editor per lane and mount a second one for Overview. Rejected: two instances double the plan-write queue wiring and focus management.

**D5. Overview menu lists a lane item per allowed lane.** A unit on the cross-lane leaderboard belongs to several lanes; asking "which lane" in a second step costs a click, so the menu lists one item per lane that allows the unit, in lane order. A locked unit is allowed (the editor already shows it with locked styling).

**D6. Desktop and mobile.** Same behaviour with two forms: the footer sits in the dialog on desktop and above the safe area in the bottom sheet on mobile with 44px actions; the chips wrap on both; the leaderboard menu is the same menu in the table row and the card. The tour copy change is one string.

## Risks / Trade-offs

- [The footer and the body disagree after an edit] → The footer reads the same draft state as the body (no copy of state), covered by a test that unticks an objective and checks both.
- [Dimmed units look disabled] → They keep full contrast of text, are focusable and clickable, and carry an accessible "does not satisfy …" description rather than relying on dimming alone.
- [Hoisting the editor changes focus return and test setup] → The host restores focus to the opener (Add team button or the row menu), and the existing editor tests are moved with it.
- [Save and add another invites duplicate teams] → The existing duplicate-member-set handling is unchanged; a future duplicate warning can be added without touching this change.

## Migration Plan

Client-only, no flag. Ship after `enforce-legendary-event-team-minimum`. Roll back by reverting; stored teams are unaffected.
