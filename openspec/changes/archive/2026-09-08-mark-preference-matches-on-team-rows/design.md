# Design — mark preferred-attribute matches on team rows

## Data

`TeamMember` gains two optional fields:

```ts
/** When a preferred trait is active AND this character has it: the trait id (for its icon/label). */
matchedTrait?: string
/** When a preferred damage type is active AND this character deals it: the damage-type id. */
matchedDamageType?: string
```

`memberOf` in `team-recommendations.ts` already receives `ctx`, which carries
`ctx.preferences` (already narrowed — an unsatisfiable preference is dropped, so
markers never appear for an ignored preference) and `ctx.characterById`. It sets
each field only when the preference is active and the character satisfies it:

```ts
const { trait, damageType } = ctx.preferences
// ...in the returned TeamMember:
...(trait && character.traits.includes(trait) ? { matchedTrait: trait } : {}),
...(damageType && character.damageTypes.includes(damageType)
  ? { matchedDamageType: damageType } : {}),
```

This is the same predicate `matchesPreferences` already uses; the fields are
additive and default-absent, so every existing consumer and snapshot test is
unaffected unless a preference is set.

## UI

`ui/team-recs/team-list.tsx` renders the markers in the existing right-hand
cluster, before the rarity icon:

- `member.matchedTrait` → `<EntityIcon src={traitIcon(member.matchedTrait)}>`
  wrapped in a `Tooltip` with `t("teamRecs:preferences.matchesTrait")`, on a
  subtle accent chip (`rounded-full bg-primary/15`) so it reads as a highlight,
  not just another attribute icon.
- `member.matchedDamageType` → same with `damageTypeIcon` and
  `preferences.matchesDamageType`.

`traitIcon` / `damageTypeIcon` are already exported from `@workspace/game-catalog`
and already used by `preference-controls.tsx`; `team-list.tsx` already imports
`characterIcon` from there.

The `TrackShortfall` list is a different component and shows the eligible roster,
not engine output — no marker there.

## i18n

`teamRecs.json` (en/de/es/fr): `preferences.matchesTrait` ("Matches your
preferred trait"), `preferences.matchesDamageType` ("Matches your preferred
damage type").
