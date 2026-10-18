# Proposal

## Why

Testing the Legendary Event Teams on a live event (Lysander, Alpha cleared through battle 13 for defeat-all, high score and No Resilient) showed three gaps. Team cards and team suggestions still credit points the player has already earned, the team editor hides its own result (covered objectives, clear depth) below a long unit grid, and the picker no longer shows how strong each character is, which V1 did at a glance.

## What Changes

- **Progress-aware team points (feedback 1).** A team card's points figure stops being the static "points per battle" (`killPoints` + covered objective scores). It becomes the team's **points left**: the canonical lane reachable points (`legendary-event-upgrade-impact`) for that team alone over battles 1..its displayed depth, net of the synced progress. A covered objective that is already cleared in every battle the team reaches is shown as **already cleared** on the card and does not count.
- **Suggestions skip spent objectives (feedback 1).** A suggestion whose objective subset contains an objective already cleared in every battle 1..its depth is dropped (the narrower subset proposes a team at least as strong), and a proposal's chips and reason line mark already-cleared objectives the same way as cards.
- **Editor shows cleared objectives (feedback 1).** The editor's covered-objective chips say "cleared through battle N" when an objective is cleared in every battle 1..the draft's depth; ticking still works as today.
- **Editor layout (feedback 2).** The editor body order becomes Name, Covered objectives, Clear depth, then Members (picker). The sticky footer is unchanged.
- **Character strength in the picker (feedback 3, recommended option pending the user's choice).** Picker tiles always show an owned unit's rarity and rank (today only under Goals Preview) and its estimated clears ("~n") on the lane, and the points on each tile become the unit's **remaining points** (the leaderboard's default figure) so ordering reflects what is left to earn. A **Sort** control offers *Points left* (default) and *Power* (effective power on the lane, descending).

No **BREAKING** changes: this is front-end only, nothing stored changes shape, and V2 is pre-production.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `legendary-event-teams`: the card's points figure becomes points left within its depth; covered objectives already cleared through that depth show as cleared and do not count; the editor marks objectives cleared through the draft depth; the editor body order changes.
- `legendary-event-team-editor-workflow`: picker tiles show rarity, rank and estimated clears for owned units, show remaining points instead of points per battle, and gain a Points left / Power sort.
- `legendary-event-team-suggestions`: proposals that rely on an objective already cleared through their depth are dropped; proposal chips and reason line mark cleared objectives.

## Impact

- `apps/web/src/fsd/entities/legendary-event/lib`: a team "points left" helper over `laneReachablePoints`, an "objective cleared through depth" helper over `LaneProgressView`, and the subset filter in `suggestLaneTeams`.
- `apps/web/src/fsd/pages/legendary-events/ui/legendary-event/teams`: `teams.view-model.ts` and `team-card.tsx` read the lane's synced progress (already available as `progressByLane` in the Teams section).
- `apps/web/src/fsd/features/legendary-event-teams`: `team-editor-dialog.tsx` section order and cleared marks; `team-picker.ts` / `team-unit-picker.tsx` remaining points, rarity/rank/clears row and sort control.
- `apps/web/src/fsd/features/legendary-event-team-suggestions`: dialog chips and reason line.
- i18n: `legendaryEvents` namespace in en/de/es/fr.
- No API change; no companion `tacticus-planner-api` change.
