## Why

A goal that is farmed only through shops (Kharn, Ragnar: Guild War shop) is invisible on Schedule: the day cards and the unit filter bar are built from raid entries, and shop supply is applied inside the estimator but never emitted. The Goals list also never says what a shop-sourced goal costs in shop currency. Follow-up to `fix-unlock-goal-shop-only-sources`, which made such goals creatable.

## What Changes

- The plan schedule records, per day and goal, the shop purchases the selected offers are projected to supply (offer, expected purchases, shards, currency spent). Display only — shop currency still never blocks or alters the estimate.
- Each Schedule day card gets a "Shops" section, after the "Raided" section, listing that day's purchases.
- Goals that selected Onslaught as an acquisition source also appear on Schedule: each day card gets an "Onslaught" section, after "Shops", listing the runs projected that day (expected shards over shards per run, the same rule as the existing token projection). Onslaught uses no energy and adds no raid cells.
- A unit with a shop purchase or an Onslaught run on a day appears in that day card's unit icons and in the character filter bar, so selecting it highlights its shop days exactly as it highlights a Rank goal's raid cells.
- The Goals list Remaining column shows a shop-currency chip (e.g. Guild War Coins) for a goal with selected shop offers: the currency still to be spent on the shards the plan attributes to shop offers, net of what the player already owns — the same "still missing" basis as the other chips.
- No API change.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `daily-raids-plan`: day cards gain a Shops section after Raided and an Onslaught section after Shops; the character filter bar and day-card unit icons also count units with shop purchases or Onslaught runs.
- `goal-farming-estimates`: the schedule exposes each selected shop offer's per-day projected purchases and each Onslaught source's per-day projected runs.
- `goal-remaining-resources`: adds the shop-currency chip.

## Impact

- `features/goal-farming` (schedule output of `estimatePlan`, `RaidDaySchedule`), `features/daily-raids` (`plan-day-cells`, day strip/card UI, unit filter), `pages/goals` (Remaining column chips).
- i18n (en + other locales), Schedule tour step, desktop and mobile layouts.
- Tests: engine, day-cells model, day card and Remaining chip UI.
