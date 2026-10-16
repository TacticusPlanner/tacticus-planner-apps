# Proposal

Apps half of the paired change `fix-legendary-event-catalog-kill-points` (companion API change in `tacticus-planner-api`, same name; the API half applies first). The apps change is fixtures, worked examples and verification only: no calculation changes.

## Why

The served Uthar lanes carried the wrong `killPoints` (34 / 26 / 17, copied from Farsight) where the game and V1 show 30 / 34 / 43; the API half corrects the catalog and makes the loader reject a lane whose `killPoints` disagrees with its first `defeatAll`. The apps use `killPoints` as the lane's per-battle defeat-all base in unit points per battle, so every Uthar figure built on it (leaderboard remaining points, master table, team cards, suggestion and upgrade-impact gains) changes with the data. The apps' test fixture of the served `lres` view and the master table's worked examples still carry the old values, and would fail or mislead once the catalog is fixed.

## What Changes

- Refresh the Uthar entry of the served-`lres` test fixture (`apps/web/src/test/fixtures/legendary-events.json`) from the corrected catalog (killPoints 30 / 34 / 43).
- Recompute the master table's Uthar worked examples: Dante's Uthar cell in All mode 4,608 → 5,004 (total 11,142 → 11,538), the Remaining example total 10,382 → 10,778, and the Estimated example's Uthar cell 1,737 → 1,947 (total 2,885 → 3,095).
- Re-run and update every test figure derived from Uthar's lane base; no production code changes.
- Not changed: how points per battle are computed, the lane overview's "kill points per battle" wording (same data, tracked as a naming follow-up in the API design), any other event's figures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `legendary-event-master-table`: the Uthar figures of its worked examples (All, Remaining and Estimated modes) follow the corrected lane base.

## Impact

- Fixture: `apps/web/src/test/fixtures/legendary-events.json` (and `legendary-events.ts` header note if it names the data's source).
- Tests: `entities/legendary-event/lib/master-table.test.ts`, `pages/legendary-events/ui/master-table/master-table-page.test.tsx` and any Uthar-based test in unit potential, team points, suggestions, upgrade impact, leaderboard and run history that reads the lane base.
- No API contract, route, copy or UI change; depends on the API half only for the real data on staging.
