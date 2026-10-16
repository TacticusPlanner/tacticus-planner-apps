# Proposal

Apps-only change. Authored to be applied after `enforce-legendary-event-team-minimum` is archived: its `legendary-event-teams` delta is written on top of that change's text, and the editor footer shows that change's minimum-size message.

## Why

V1's Add LRE Team dialog is quicker to use than V2's. V1 is objective-first: ticking objectives narrows and ranks the unit list, a one-click "Add top 5" fills the team, and clicking a cell opens the dialog preseeded. V2's editor lists every unit of the lane (dozens of tiles) ordered by points per battle with small objective icons to read, derives coverage afterwards, hides coverage and depth below the fold and closes after every save. Building the several teams a lane needs (Fabius has 14) means scanning the grid again each time. The V2 editor is better on defaults (derived name, estimated depth, derived coverage); it is worse on getting to a good team quickly.

## What Changes

- The picker gets objective chips (the lane's five objectives, multi-select, with counts); units that satisfy every selected objective come first and the others are dimmed, none hidden.
- The editor footer stays visible while the body scrolls and shows the member count (and the three-character rule), the covered objectives, the depth and the actions.
- A **Save and add another** action saves a new team and resets the editor for the next one, keeping the objective chips, Only unlocked, search and Goals Preview.
- A leaderboard row's actions menu gains **Add to new team** (lane leaderboards: that lane; Overview: one item per lane that allows the unit), opening the editor with the unit as first member.
- The editor is mounted once at the event page so the Overview leaderboard can open it.
- Decided not to build (owner's choice): auto-fill best 3 to 5, objective chips on the Lane overview as team entry, one-click quick teams.

## Capabilities

### New Capabilities

- `legendary-event-team-editor-workflow`: objective filtering and ranking in the picker, the always-visible footer, Save and add another, and the leaderboard Add to new team action.

### Modified Capabilities

- `legendary-event-teams`: the editor may stay open after a save (Save and add another) and its picker carries the objective chips.

## Impact

- Code (`apps/web/src/fsd`): `features/legendary-event-teams` (`model/team-picker.ts` ordering and counts, `model/team-editor-draft.ts` reset for the next team, `ui/team-editor-dialog.tsx` footer and actions, `ui/team-unit-picker.tsx` chips), `shared/ui/responsive-dialog.tsx` (footer stays visible; check it already does), `pages/legendary-events/ui/legendary-event/teams/teams-section.tsx` (editor hoisted to a page-level launcher), `leaderboard/leaderboard-parts.tsx`, `leaderboard-table.tsx`, `leaderboard-list.tsx` and the Overview leaderboard (menu item and lane items), and the event page tour copy.
- Copy: chips, counts, footer, actions, menu items and the tour step in `public/locales/{en,de,es,fr}/legendaryEvents.json` and the tour namespace.
- Tests: picker, editor, footer, save-and-add-another, launcher and leaderboard menu tests.
- No API, schema or catalog change; no new route.
