# Proposal

## Why

Severyn checked the HRE tab against the game during the live Zapspitta event (2026-10-18 to 11-01), on days 4 and 8. The reward tables are right: every milestone from 100 to 500,000 points, chest tiers 14 and 17, the 44 daily payout and the final crate all match. The page around them does not hold up as well:

- The Event pace card rebuilds the whole event from points and rank. It never uses the currency, chest tier and shards the game shows. It assumes today's payout for past days and today's rank for a week 1 crate that has already been paid.
- At 7,464, 10,015 and 15,657 points the card showed the same 6,366 currency, tier 20 and 431 shards. All three projections fell between the 28,000 and 30,000 milestones, so the math was right, but nothing on the card said why.
- Chest shards are counted at the low end of each "X to X+1" range without saying so. By day 8 the card was 7 shards under the game.
- The rank entered goes stale (30,668 entered against 26,602 in the game), and the card neither shows the payout that rank implies nor when it was entered.
- Picking another mission in the tracker resets both objectives to 0, and "Mission complete" cannot be undone.
- Big objectives (250 wins) can only be typed.
- "Fight by hand" joins up to nine sentences into one paragraph, and for featured-hero objectives it states both "Xenos units" and "Orks units" deploy rules.
- On mobile the pace card is the last section, although its inputs change most often.

Evidence: `hre/live/2026-10-25/` screenshots and `hre/ux-audit.md` in the project files; `features/hre-missions/model/hre-pace.ts`, `ui/pace-card.tsx`, `model/use-hre-progress.ts`, `ui/current-mission-card.tsx`, `features/daily-raids/ui/hre-missions/hre-hand-battles.tsx`, `pages/dailies/ui/hre-page.tsx`.

## What Changes

- **Event pace from what the player has.** Optional inputs for currency owned, the next chest tier, and the featured hero's current step with shards toward the next one, all read off the game's event screen. With them, the projection starts from the shards held and the currency in hand and adds only the income still to come. Without them it keeps today's points-only chain.
- **Next milestone and next chest.** The card names the next milestone and its reward, and (with the owned inputs) the next chest's cost and the currency still missing for it.
- **Shards as a floor.** Projected shard totals read "at least".
- **Rank context.** The bracket line shows its daily payout, and the rank shows how long ago it was entered.
- **Safe mission tracker.** Progress is kept per mission, so switching back restores it. "Mission complete" offers Undo. Each open objective gets "+1", plus "+10" when its target is 20 or more.
- **Tidy "Fight by hand".** The "raids don't count these" line stays visible. The node rules become a bullet list folded under "Node rules". The alliance rule is dropped when the featured hero's faction rule is shown.
- **Mobile pace summary.** On mobile, a one-line pace summary sits under the current mission and jumps to the full card.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `hre-event-pace`: owned-state inputs and the projection from them, next milestone and next chest, "at least" shards, payout and rank age on the bracket line, the mobile summary.
- `hre-mission-tracker`: progress per mission, Undo after "Mission complete", +1 and +10 steppers, the stored entry's new fields.
- `hre-campaign-raids`: the "Fight by hand" note as a visible reason plus folded node rules, without the redundant alliance rule.

## Impact

- `features/hre-missions`: `hre-pace.ts`, `hre-progress.ts`, `use-hre-progress.ts`, `pace-card.tsx`, `current-mission-card.tsx`, a new pace summary component, their tests.
- `features/daily-raids/ui/hre-missions/hre-hand-battles.tsx` and `pages/dailies/ui/hre-page.tsx` (request and mobile order), `hre-page.tutorial.tsx` (mobile step), `apps/web/public/locales/*/hre.json` and `dailies.json` (tour copy).
- Stored progress keeps its key (`tp.dailies.hre.progress.v1`). The new fields are optional, so older entries still parse.
- No API change, no companion `tacticus-planner-api` change. Cross-device sync of HRE progress is left to its own change.
