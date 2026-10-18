# Design

## Context

Every served event has ten regular and ten premium missions built from a handful of templates (checked across Lysander, Bile, Farsight and Uthar): defeat waves while dealing damage, defeat N of a faction, use abilities with an alliance, defeat waves dealing a damage type, defeat N enemies with an alliance, win N battles without deploying a trait, win a battle without summoning, defeat N enemies with a damage type. The game does not sync mission progress, so ticks are user-entered like the other run inputs.

## Decisions

### D1. The server parses mission text into typed requirements

The raw files keep their text; the denormalizer maps each line through a closed set of templates to `{ index, kind, count, faction?, alliance?, damageType?, trait?, text }` and the loader rejects a line no template matches. A new template in a future event fails the catalog build rather than silently degrading suggestions.

### D2. Ticks are stored per run; the count stays as the plan

`completedRegularMissions` / `completedPremiumMissions` (catalog indices) are stored per run next to the existing counts. The counts keep meaning "missions this run will complete" for the forecast, so a Planned run still forecasts 10 missions with nothing ticked. The drawer raises the count when a tick would exceed it; the server rejects a count below the ticks.

### D3. Matching rules

- `defeatFaction`: the battle has an enemy of that faction (from the battle's waves and the `npcs` dataset), not the lane's label.
- `defeatWithAlliance`, `useAbilitiesWithAlliance`: at least one non-reserve member of that alliance.
- `damageType`, `defeatWithDamageType`: a member deals that type, through `characterDealsDamageType`-style exclusions.
- `winWithoutTrait`: no non-reserve member has the trait; `winWithoutSummon`: no member has the Summon trait.
- `anyBattle` (waves and plain damage): every token progresses it; such missions are listed as "any battle" and never pick a token.

A token progresses a mission; how much (enemies defeated, damage dealt) is not modelled.

### D4. Points stay first; missions offer an alternative

Missions pay currency, not points, and the exchange is not linear (milestones and chests are stepped), so the plan order stays points-optimal. The For missions alternative is the playable planned token (same eligibility as the Next token) progressing the most open, non-`anyBattle` missions, ties broken by points then plan order, shown only when it progresses more than the Next token does.

## Risks / Trade-offs

- Wave-based missions: assumed to count in Legendary Event battles. If the game says otherwise, `anyBattle` missions simply never show as progressed.
- Faction matching depends on battle wave data; a battle without served waves progresses no `defeatFaction` mission.

## Open questions

- Should missions ever reorder the plan (for example a per-mission points bonus)? Default: no, alternative only.
