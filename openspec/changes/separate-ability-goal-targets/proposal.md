## Why

The create-goal sheet's Ability card only lets a user pick **one** target level that is
forced onto both ability tracks at once, and the target dropdown offers just six values —
one rarity-cap milestone per tier (8 / 17 / 26 / 35 / 50 / 60). A player who wants "active
to 20, leave passive alone" or "active to 20, passive to 15", or any level that is not a
rarity cap, cannot express it, even though the wire model (`AbilityTarget` with separate
`activeStart/activeEnd/passiveStart/passiveEnd`), the combined-goal spec builder, the
create-goal validation, and the backend `GoalTargetValidationService` already handle
independent per-track ranges. V1's set-goal dialog already exposes separate "Active target
level" / "Passive target level" numeric fields over the full range, so this is a V2 parity
gap. The same card also mislabels Machine-of-War tracks as "Active" / "Passive" when MoWs
have **Primary** / **Secondary** abilities.

## What Changes

### Two independent target fields, one goal

- Replace the Ability card's single **Target level** control with **two** target selectors,
  one per track, each defaulting to the track's own current level + 1 and each editable
  independently. Both tracks may advance in a single Ability goal; the existing "at least
  one track must move above its start" rule is unchanged.
- The two targets feed the already per-track `abilityActiveEnd` / `abilityPassiveEnd`
  (`end = max(currentLevel, chosenTarget)`), so the spec builder, validation, preview, and
  backend payload need no shape change.

### Full target-level range

- Each track's target selector offers **every** integer level from the track's current
  level + 1 up to the maximum ability level (the Mythic-tier cap, currently 60), replacing
  the six-item rarity-milestone list. Rarity tiers MAY remain as visual section headers
  within the list.
- A target above the unit's **current** rarity ability cap is selectable (not hidden or
  disabled).

### Above-cap targets auto-suggest prerequisites, like Rank

- When a chosen ability target exceeds what the unit's current progression allows, the
  create-goal sheet auto-suggests the prerequisite goals the same way a too-high Rank
  target does today:
  - an **Ascension** suggestion to raise the unit into the rarity tier whose ability cap
    covers the target (the `needsAscension` detector, currently Rank-only, also considers
    ability targets);
  - a **Level** suggestion to reach the character level the ability target implies (the
    `needsLevel` detector already derives this from `max(abilityActiveEnd,
abilityPassiveEnd)` and works unchanged once the per-track targets flow in).

### Machine-of-War ability terminology

- The Ability card and the unit info card label the two tracks by entity type: **Active** /
  **Passive** for a Character, **Primary** / **Secondary** for a Machine of War — for both
  the new target fields and the existing read-only current-level fields.

### Machine-of-War dual-track cost

- The MoW ability farming/cost derivation currently assumes exactly one track advances per
  goal (`goal-requirements.ts` picks the track by `activeEnd > activeStart`). It SHALL emit
  farming stages and resource needs for **both** tracks when both advance, so a MoW Ability
  goal that raises Primary and Secondary together no longer silently drops the Secondary
  cost. (Character ability cost remains unsupported, as today.)

### i18n

- New `goals.create.ability.*` keys for the per-track target labels and the
  Active/Passive vs Primary/Secondary current-level labels; the create-goal tutorial step
  that points at the Ability target control is updated for the two-field layout.

No API change: the request/response model, validation, and persisted config already carry
independent active/passive ranges.

## Capabilities

### New Capabilities

- _None._

### Modified Capabilities

- `goal-creation`: adds requirements for the Ability card — two independent per-track target
  selectors in one goal, the full current+1..max level range, selectable above-cap targets
  that trigger Ascension and Level prerequisite suggestions, and entity-typed track labels
  (Active/Passive for Characters, Primary/Secondary for MoWs).
- `goal-farming-estimates`: adds a requirement that a Machine-of-War Ability goal advancing
  both ability tracks contributes the farming demand and resource cost of **both** tracks,
  not only the first.

## Impact

- **Frontend (`apps/web`) — create-goal only:**
  - `model/goal-creation-form/use-ability-fields.ts` — two target values + setters, per-track
    defaulting, `prefillFrom` seeds both; `defaultTargetLevel` becomes per-track.
  - `ui/create-goal/goal-type-fields.tsx` (`AbilityGoalFields`) — two selects, full-range
    option list with rarity headers, entity-typed labels.
  - `ui/create-goal/goal-type-cards.tsx` — wire the two targets/handlers through.
  - `ui/create-goal/unit-info-card.tsx` — entity-typed current-level labels.
  - `model/goal-creation-form/use-goal-prerequisites.ts` — `needsAscension` also fires for
    ability targets above the current rarity cap (new
    `minProgressionForAbilityLevel`-style helper, mirroring `minProgressionForRank`).
  - `model/goal-creation-form/use-create-goal-form.ts` — pass the per-track targets to the
    prerequisite/preview/validation hooks (already four-param downstream).
- **Frontend — MoW cost:** `features/goal-farming/lib/goal-requirements.ts` (MoW `Ability`
  branch) — cost both tracks when both advance.
- **i18n:** `apps/web/public/locales/*/common.json` `goals.create.ability.*`; create-goal
  tutorial step.
- **Tests:** `use-ability-fields` (new), `goal-validation.test.ts`,
  `goal-spec-builder.test.ts`, `use-goal-prerequisites.test.ts`, `goal-requirements` MoW
  ability coverage, `create-goal-sheet.test.tsx` Ability section.
- **Unchanged:** wire model / `AbilityTarget`, `goal-spec-builder` payload shape,
  `getGoalValidationIssue` per-track logic, backend `GoalTargetValidationService`,
  goal detail/edit sheet (Ability goals are not editable after creation).
- **Reference:** V1 `tacticusplanner` `set-goal-dialog.tsx` (separate active/passive target
  fields over the full range) is the parity target.
