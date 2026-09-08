## 1. Engine

- [x] 1.1 `team-recommendations.types.ts`: add `TeamMemberPreferenceMatch`
      (`{ id: string; matched: boolean }`); replace `TeamMember.matchedTrait` /
      `matchedDamageType` with `preferredTrait?` / `preferredDamageType?` of that
      type.
- [x] 1.2 `team-recommendations.ts`: in `memberOf`, set `preferredTrait` /
      `preferredDamageType` whenever the corresponding narrowed preference is
      active, with `matched` from the character's `traits` / `damageTypes`.
- [x] 1.3 `team-recommendations.test.ts`: update the marker test to the new
      shape — a matching member has `{ id, matched: true }`, a non-matching
      member has `{ id, matched: false }`, and with no preference the fields are
      absent.

## 2. UI

- [x] 2.1 `ui/team-recs/team-list.tsx`: `preferenceMarker` takes a
      `TeamMemberPreferenceMatch | undefined` and renders the emphasised chip +
      `matches*` tooltip when `matched`, and a de-emphasised
      (`opacity-40 grayscale`, no chip bg) marker + `missing*` tooltip when not.
      Use `cn` from `@workspace/ui/lib/utils`.
- [x] 2.2 Add `preferences.missingTrait` / `preferences.missingDamageType` to
      `apps/web/public/locales/{en,de,es,fr}/teamRecs.json`.
- [x] 2.3 Extend `team-translations.test.ts`'s `teamRecs` spot-check with the two
      new keys.

## 3. Verification

- [x] 3.1 `pnpm --filter web exec vitest run src/fsd/pages/dailies` — green.
- [x] 3.2 `pnpm --filter web typecheck` — 0 errors.
- [x] 3.3 `pnpm --filter web lint` and `pnpm --filter web lint:fsd` — clean.
- [x] 3.4 `pnpm test:run` — full suite green.
- [x] 3.5 `pnpm format` and `git diff --check` — clean.
- [x] 3.6 `openspec validate mark-preference-mismatches-on-team-rows --strict` —
      passes.

## 4. Manual verification

- [x] 4.1 Against the running Aspire stack: with a Preferred trait set on the
      Salvage Run (and Arena) page, every Plan-team and Random-team row shows a
      marker — full-colour chip on the matching characters, muted icon on the
      widened-in filler that misses it — each with the right tooltip. Adding a
      Preferred damage type adds a second marker per row on the same basis.
      Clearing both preferences removes all markers.
