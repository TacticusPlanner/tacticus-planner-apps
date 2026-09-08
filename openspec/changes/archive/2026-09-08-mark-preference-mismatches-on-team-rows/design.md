# Design — mark preference misses, not just matches

## Data

Replace the match-only fields on `TeamMember` (added but not yet released in
`mark-preference-matches-on-team-rows`) with a shape that also carries the
non-match case:

```ts
export type TeamMemberPreferenceMatch = {
  /** The active preferred trait / damage-type id (for its icon and label). */
  id: string
  /** Whether this character satisfies the preference. */
  matched: boolean
}

// on TeamMember:
/** Present iff a preferred trait is active (after narrowing). */
preferredTrait?: TeamMemberPreferenceMatch
/** Present iff a preferred damage type is active. */
preferredDamageType?: TeamMemberPreferenceMatch
```

`memberOf` sets each one whenever the corresponding narrowed preference is set:

```ts
const { trait, damageType } = ctx.preferences
...(trait
  ? { preferredTrait: { id: trait, matched: character.traits.includes(trait) } }
  : {}),
...(damageType
  ? { preferredDamageType: {
      id: damageType, matched: character.damageTypes.includes(damageType),
    } }
  : {}),
```

`ctx.preferences` is already narrowed, so an unsatisfiable preference is absent
and produces no markers at all.

## UI

`ui/team-recs/team-list.tsx` — the `preferenceMarker` helper takes a
`TeamMemberPreferenceMatch | undefined` and branches on `matched`:

- **match**: the current treatment — `rounded-full bg-primary/15` chip, full-
  colour icon, tooltip `preferences.matchesTrait` / `matchesDamageType`.
- **miss**: same size slot, no chip background, `opacity-40 grayscale` on the
  icon, tooltip `preferences.missingTrait` / `missingDamageType`.

`cn` from `@workspace/ui/lib/utils` (already the repo convention) toggles the
classes.

## i18n

`teamRecs.json` (en/de/es/fr): add `preferences.missingTrait` ("Missing your
preferred trait ({{attribute}})") and `preferences.missingDamageType` ("Doesn't
deal your preferred damage type ({{attribute}})"). Keep the existing
`matchesTrait` / `matchesDamageType`.
