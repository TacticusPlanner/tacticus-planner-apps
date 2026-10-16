## Why

UserJot feedback "Clarify onslaught tier and sector progression" (Sep 17):

> Do we need a Tier 4, when it's the same as Tier 3? I understand it's used to mark completion, but it may be confusing. Moving up a sector doesn't reset Tier to 1 (Gold 4 → Diamond lands on Diamond 4); moving down from Diamond 1 to Gold sets Gold 1. Expect tier 1 when increasing sectors, 4 when decreasing.

Maintainer reply: the reset is to be fixed exactly so, and Tier 4 made clearer, e.g. a separate "sector complete" toggle instead of a fourth tier choice. A later comment (sysadmiral):

> when you set an onslaught it doesn't seem to pull through when you're creating a goal for ascension. The tickbox tells you to go and edit onslaught settings.

Findings:

- The sector→tier reset is already implemented and tested (`tier-after-sector-change.ts`: up → 1, down → 4, same → unchanged), shipped in the `onslaught-progress-entry` spec. No change needed beyond moving tier 4 to the toggle.
- sysadmiral's report matches the Edit goal dialog, which hard-coded `onslaughtProgressSaved={false}` and therefore always showed the "Set your Onslaught progress" prompt. That was fixed by `efb31e6` (Oct 12, #195), after the comment. The create path reads the same saved progress; this change adds create-sheet regression tests (saved → shards/day, unset → prompt).
- The inverse defect remains: the API answered Stone 1 for alliances that were never saved and the client treated any response as "saved", so the prompt never appeared for new players and every estimate silently used Stone 1 yields. Fixing that needs the server to say whether an alliance was saved (a `revision === 0` heuristic is wrong because the overrides row is shared with campaign-event overrides), hence the companion API change.
- The page itself is unclear: no explanation of current vs. cleared, "Tier 4 · sector complete" reads like a fifth tier, inconsistent labels ("Gold 2" vs "Gold tier 2"), raw English alliance names, and nothing shows what a position is worth.

Companion API change: `clarify-onslaught-progression` in `tacticus-planner-api` (adds `isSet` per alliance to the onslaught-progress response and lets PUT send `null` for an unset alliance). Apply the API half first.

## What Changes

- Consume `isSet`: `progressForAlliance` returns `undefined` for an unset alliance; Save sends unset alliances as `null`.
- Onslaught page: unset alliances show a "Not set" badge, a "Not set" sector placeholder, a disabled tier select and a hint instead of a yield; they are never highlighted in the reference table. Choosing a sector sets the alliance (tier 1).
- Tier 4 is no longer a Tier option: the Tier select offers Tier 1–3 and each alliance card gets a separate "Sector complete" checkbox. Checking it stores tier 4 (shown as Tier 3 in the select); unchecking returns to tier 3; picking a tier clears it; the sector-change rules still apply (up → tier 1, unchecked; down → checked). Stored values and the API contract for tier are unchanged.
- Clarity: a help line under the alliance cards (pick the sector and tier you are currently farming — the one your next run uses; tick "Sector complete" once Tier 3 is cleared, it keeps paying tier-3 rewards); positions everywhere read "Gold · Tier 2" / "Gold · Sector complete" with localized sector names; alliance names are localized; each card shows its shards per run for every reward rarity; the My Game tab description is reworded.
- Goals: the create preview and Edit goal dialog prompt to set progress when the unit's alliance is unset; `computeGoalAcquisition` (Today, Plan insights, per-project estimates) supplies no Onslaught shards for an unset alliance.
- i18n: new/changed `common` keys in en/de/es/fr.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `onslaught-progress-entry`: "Sector complete" checkbox replaces the tier-4 option; not-set state, help copy, consistent position labels, per-alliance yield.
- `goal-acquisition-source-picker`: "saved progress" is per the unit's alliance (`isSet`), in creation and the Edit goal dialog.
- `goal-farming-estimates`: an unset alliance supplies zero Onslaught shards.

## Impact

`entities/player-data-override` (types, API mapper), `pages/onslaught/ui/*` (page split into `onslaught-alliance-card.tsx`, `onslaught-emblem.tsx`, `onslaught-position.ts`), `pages/goals/model/goal-creation-form/{onslaught-yield,use-progression-preview}.ts`, `pages/goals/model/goal-edit/use-goal-edit-acquisition.ts`, `features/goal-farming/lib/goal-acquisition.ts`, `public/locales/{en,de,es,fr}/common.json`, and colocated tests. Contract change on `GET/PUT me/player-data-overrides/onslaught-progress` (companion API change). No new route or namespace.
