# Design

## D1. Owned state is optional and read off the game screen

The game's event screen shows "You own: N", the next chest ("Tier 17", with its cost) and the featured hero's shard bar ("214/280 Unlock at Rare", or "17/50 Promote"). The card asks for exactly those: currency owned, next chest tier, and the current step plus shards toward the next step. The step picker lists "Not unlocked" and every step from the hero's unlock. Shards held = the step's cumulative shards + the shards toward the next one ("Not unlocked" counts from 0). At Legendary blue star there is no next step, so the second input is hidden and counts as 0.

The three inputs act as one group: the owned projection runs only when all three are set. Otherwise the card uses the existing points-only chain and says that filling them in improves the estimate. The game shows a total for none of these, so no input asks for one.

## D2. Income still to come

With the owned inputs, at elapsed days `e` (from the start) and current mission `m` from the tracker:

- milestones: cumulative(projected points) − cumulative(points now)
- missions: (20 − missions done) × 100. Missions done = `min(m − 1, 20)`. The Bonus mission gives none.
- daily payouts: (14 − `floor(e)`) × the bracket's daily payout. Payouts arrive on days 2 to 15, so `floor(e)` have arrived.
- crates: the week 1 crate while `e` < 7, plus the week 2 crate, at the current bracket, for both currency and shards.

Currency available = owned + income still to come. Chests open from the entered tier upward while the available currency covers the next cost. Shards = held + those chests' minimum shards + the crate shards still to come.

The target uses the same base. Chest shards needed = target − held − crate shards still to come, opened from the entered tier. Milestone currency needed = that chests' cost − owned − missions − payouts − crates still to come. Points needed = the lowest milestone whose cumulative reaches cumulative(points now) + that amount. Shards and currency needed are clamped at 0; 0 chest shards needed means the target is reached, and no days left with the target unmet means it is out of reach.

## D3. Per-mission progress in the stored entry

The stored entry gains `byMission` (mission number → its two values) next to `progress`. Choosing a mission saves the current pair under the current number and loads the chosen one's (0 and 0 if none). "Mission complete" saves the finished pair before advancing. Undo restores the whole previous entry. It is held in memory for one toast (the app's existing sonner toasts) and is not stored.

New optional fields: `byMission`, `owned` (`{ currency, nextTier, step, toNext }`), `rankAt` (ms). The storage key stays `v1`. Parsing drops invalid new fields alone and keeps the rest of the entry.

## D4. Mobile summary vs desktop card

Desktop keeps the two columns. The pace card stays in the right column, which is visible next to the tracker. Mobile is one long column, so a one-line summary goes under the tracker: points → projected points, and the step reached, plus a button that scrolls to the card. That takes a new `hre-pace-summary` test id. The mobile tour's "pace" step targets the summary. The desktop tour keeps `hre-pace`.

## D5. Node rules fold, the reason stays

The first sentence ("Raids don't count kills, … so fight these battles yourself.") stays a visible paragraph. The others become a bullet list in a `<details>` titled "Node rules", closed by default on both layouts. The "more battles needed" line stays outside it.
