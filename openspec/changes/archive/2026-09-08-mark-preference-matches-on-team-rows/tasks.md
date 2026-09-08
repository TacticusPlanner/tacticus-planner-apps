## 1. Engine

- [x] 1.1 `team-recommendations.types.ts`: add optional `matchedTrait?: string`
      and `matchedDamageType?: string` to `TeamMember`.
- [x] 1.2 `team-recommendations.ts`: in `memberOf`, set `matchedTrait` /
      `matchedDamageType` from `ctx.preferences` + the character's
      `traits` / `damageTypes` (only when the preference is active and matched).
- [x] 1.3 `team-recommendations.test.ts`: a case with a preferred trait + damage
      type set — matching members carry the ids, non-matching members carry
      neither, and with no preference set no member carries them.

## 2. UI

- [x] 2.1 `ui/team-recs/team-list.tsx`: render a `traitIcon(member.matchedTrait)`
      marker and a `damageTypeIcon(member.matchedDamageType)` marker (each in a
      subtle accent chip, in a `Tooltip` with the new `teamRecs` copy) before the
      rarity icon. Nothing renders when the fields are absent.
- [x] 2.2 Add `preferences.matchesTrait` / `preferences.matchesDamageType` to
      `apps/web/public/locales/{en,de,es,fr}/teamRecs.json`.
- [x] 2.3 Extend `team-translations.test.ts`'s `teamRecs` spot-check with the two
      new keys.

## 3. Verification

- [x] 3.1 `pnpm --filter web exec vitest run src/fsd/pages/dailies` — green
      (Arena + Salvage Run page tests already mock `traitIcon`/`damageTypeIcon`).
- [x] 3.2 `pnpm --filter web typecheck` — 0 errors.
- [x] 3.3 `pnpm --filter web lint` and `pnpm --filter web lint:fsd` — clean.
- [x] 3.4 `pnpm test:run` — full suite green.
- [x] 3.5 `pnpm format` and `git diff --check` — clean.
- [x] 3.6 `openspec validate mark-preference-matches-on-team-rows --strict` —
      passes.

## 4. Manual verification

- [x] 4.1 Against the running Aspire stack: set a Preferred trait on the Salvage
      Run (and Arena) page — matching characters in both the Plan team and the
      Random team show the trait icon with a tooltip; the widened-in filler that
      does not match shows none. Set a Preferred damage type too — both markers
      appear on characters that match both. Clear the preferences — all markers
      disappear.
