# Proposal

## Why

The Next token card picks the battle worth the most points and ignores the event missions, which pay currency (25 each, 40 with the premium track) and so count toward the event unit's shards. The run inputs drawer only stores how many missions a run completes, so the planner cannot tell which missions are still open, and the catalog serves missions as English free text it cannot match against teams or battles. Severyn wants mission progress tracked per run and battles suggested that move open missions forward.

## What Changes

- **Structured missions (API half).** The catalog serves each regular and premium mission as a typed requirement (for example `defeatFaction` Necrons × 30, `winWithoutTrait` Big Target × 5, `defeatWithAlliance` Chaos × 30, `damageType` Piercing) next to its text. Companion change: `tacticus-planner-api` `add-legendary-event-mission-tracking`, which applies first.
- **Mission checklist per run.** The run inputs drawer lists each run's missions with a Done tick (premium missions only with Show paid options on). The count used by the forecast stays, now "Plan to complete", and can never be below the ticked count. Mission labels are rendered from the typed requirement through i18n, so they are translated.
- **Mission matching.** For each open mission of the current run the planner decides which planned tokens progress it: by the battle's enemies (defeat a faction), the team's members (alliance, damage type, abilities) or what the team lacks (win without a trait, without summoning). Missions any battle progresses ("defeat waves, deal damage") are marked as such and never used to choose a battle.
- **Mission-aware Next token.** The Next token card adds a "Progresses" line naming the open missions the token moves forward. When another playable planned token progresses more open missions, the card shows it as a **For missions** alternative with its points difference ("Beta battle 4 · +210 points (−30) · progresses Defeat 75 AdMechs, Win 5 battles without Big Target"). The token plan's order stays points first.

No **BREAKING** changes for users. The run inputs contract gains two fields (V2 is pre-production).

## Capabilities

### New Capabilities

- `legendary-event-missions`: typed mission requirements on the client, the per-run checklist state, and which tokens progress an open mission.

### Modified Capabilities

- `legendary-event-run-inputs`: the drawer shows a mission checklist per run; the counts become "Plan to complete" with the ticked count as floor.
- `legendary-event-token-plan`: the Next token card shows missions progressed and a For missions alternative.

## Impact

- API: catalog `lres` mission records and run inputs contract (companion change).
- `entities/legendary-event`: mission types, label formatter, `tokenProgressesMission`.
- `features/legendary-event-run-inputs`: checklist UI and patches; `features/legendary-event-tokens`: Next token card.
- `legendaryEvents` i18n for every mission kind in en/de/es/fr.
