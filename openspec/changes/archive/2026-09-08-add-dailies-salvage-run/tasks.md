## 1. Persisted-controls helper

- [x] 1.1 Create `pages/dailies/model/team-recommendation-prefs.ts` with
      `usePersistedMode(storageKey)`, `usePersistedTeamSize(storageKey)`,
      `usePersistedPreferences(storageKey)` — the storage/parse/merge logic lifted
      verbatim from `use-arena-recommendations.ts`, parameterized by key.
- [x] 1.2 Reduce `usePersistedArenaMode` / `usePersistedTeamSize` /
      `usePersistedArenaPreferences` in `use-arena-recommendations.ts` to
      one-line wrappers over the generics with the existing `tp.dailies.arena.*`
      keys. Verify `use-arena-recommendations.test.tsx` passes unchanged.

## 2. Salvage Run engine config

- [x] 2.1 Create `pages/dailies/model/salvage-recommendations.types.ts`:
      `SalvageTrack = "Imperial" | "Chaos" | "Xenos"`, `SALVAGE_TRACKS` ordered
      list, `isSalvageTrack` guard, `SalvageEligibleCharacter`
      (`{ unitId, rank, rarity }` for the shortfall list),
      `SalvageRosterCatalog` (adds `alliance` to Arena's `{ traits, damageTypes }`),
      `BuildSalvageRecommendationsInput` (Arena's input + `track` + `rosterCatalog`
      required, roster is `ArenaRosterCharacter[]`),
      `SalvageRecommendationsViewModel` (Arena's ready fields + `track` /
      `setTrack`, plus the `insufficient-track` variant).
- [x] 2.2 Create `pages/dailies/model/salvage-recommendations.ts`:
      `buildSalvageRecommendations(input)` — filter `input.roster` to
      `rosterCatalog.get(id)?.alliance === input.track`, build the same
      `active-project` / `overall-goals` `TeamPoolSpec`s as Arena from the
      contribution lists (already intersected with the filtered roster), delegate
      to `buildTeamRecommendations`. Re-use `collectContributions` /
      `mapRosterCharacter` from the engine module.
- [x] 2.3 Create `salvage-recommendations.test.ts`: off-alliance goal
      contributor never appears; widening stays within the alliance; a preference
      only off-alliance characters satisfy is ignored (teams still full, still
      in-alliance); switching `track` changes the teams; two pools still ordered
      project-before-goals within the alliance.

## 3. Salvage Run hook

- [x] 3.1 Create `pages/dailies/model/use-salvage-recommendations.ts`:
      `usePersistedSalvageTrack()` (key `tp.dailies.salvage.track`, default
      `"Imperial"`, validated against `SALVAGE_TRACKS`); the mode / size /
      preference state from the generics with `tp.dailies.salvage.*` keys;
      `getPlayerCharacters` + `getCharactersMap` live queries (same
      `LIVE_QUERY_ERROR` sentinel shape as Arena); goals + project-goals queries
      as in Arena.
- [x] 3.2 Compute `trackRoster` = synced roster filtered to the selected track's
      alliance; `rosterCatalog` (traits / damageTypes / alliance) and
      `availableTraits` / `availableDamageTypes` as unions over `trackRoster` only.
- [x] 3.3 View-model branches: `loading` (any query pending / roster / catalog
      missing), `error` (any query failed) with `retry`, `insufficient-track`
      (`trackRoster.length < MIN_TEAM_SIZE` — carry `track`, `setTrack`,
      `ownedCount`, `needed`, `eligible: SalvageEligibleCharacter[]` built from
      `trackRoster` via `progressionRarity`), else `ready` with
      `buildSalvageRecommendations`,
      `track`, `setTrack`, and the Arena ready fields (`mode`, `setMode`,
      `teamSize`, `setTeamSize`, `availableSizes`, `preferences`, `setPreferences`,
      `availableTraits`, `availableDamageTypes`, `toggleRandomLock`,
      `lockedRandomUnitIds`, `regenerate`, `recommendations`).
- [x] 3.4 Create `use-salvage-recommendations.test.tsx` (mirror the Arena hook
      test): track default / round-trip / bad stored value; mode + size persisted
      under `tp.dailies.salvage.*` and independent of `tp.dailies.arena.*`;
      `insufficient-track` when the track has < 3 owned; `ready` filters to the
      track; switching track re-teams; loading / error / retry.

## 4. Shared shortfall UI

- [x] 4.1 Create `pages/dailies/ui/team-recs/track-shortfall.tsx`:
      `<TrackShortfall track ownedCount needed eligible testIdPrefix>` — a Card
      with `salvageRun:track.shortfallTitle`, `salvageRun:track.shortfall`
      (interpolating `owned`, `needed`, `track`), and a `<TeamList>` of `eligible`.
      `data-testid={`${testIdPrefix}-insufficient-track`}`.

## 5. Salvage Run page + tour

- [x] 5.1 Create `pages/dailies/ui/salvage-run/track-selector.tsx`:
      `<AllianceTrackSelector track onTrackChange>` — a `Tabs` triplet like
      `mode-toggle.tsx`, one trigger per `SALVAGE_TRACKS` entry with
      `onslaughtAllianceIcon(track)` and label `salvageRun:track.<lowercase>`,
      wrapper `data-testid="salvage-track-selector"`.
- [x] 5.2 Create `pages/dailies/ui/salvage-run/desktop/salvage-desktop.tsx` and
      `mobile/salvage-mobile.tsx` — mirrors of the Arena layouts passing
      `testIdPrefix="salvage"` to `<TeamCategorySection>`; `data-testid`
      `salvage-desktop` / `salvage-mobile`.
- [x] 5.3 Create `pages/dailies/ui/salvage-run/salvage-run-page.tsx` — copy of
      `arena-page.tsx` with `useTranslation(["salvageRun", "teamRecs"])`,
      `testIdPrefix="salvage"` on every team-recs component, `<AllianceTrackSelector>`
      first in the header row, and an `insufficient-track` branch rendering
      `<TrackShortfall>`. `data-testid="salvage-run-page"`.
- [x] 5.4 Create `pages/dailies/ui/salvage-run/salvage-run-page.tutorial.tsx`:
      `useSalvageRunTutorial`, namespace `salvageRun`, steps
      `purpose, track, mode, project, teamSize, preferences, plan, locks, regenerate`
      targeting the `salvage-*` test ids; desktop === mobile.
- [x] 5.5 Create `salvage-run-page.test.tsx` and
      `salvage-run-page.tutorial.test.tsx` (mirror the Arena page + tutorial
      tests): renders the track selector + both categories; switching the track
      calls `setTrack`; the `insufficient-track` panel lists the eligible members
      and shows no category sections; desktop/mobile parity of controls and
      members; all nine tour targets resolve.

## 6. Routing & i18n

- [x] 6.1 `pages/dailies/route.tsx`: add a lazy `SalvageRunPage` route for
      `salvage-run`; drop `"salvage-run"` from the placeholder `map`.
- [x] 6.2 Create `apps/web/public/locales/en/salvageRun.json` — `title`,
      `subtitle`, `track.{label,imperial,chaos,xenos,shortfallTitle,shortfall}`,
      `tour.salvageRun.steps.{purpose,track,mode,project,teamSize,preferences,plan,locks,regenerate}.{title,content}`.
- [x] 6.3 Add real de / es / fr `salvageRun.json` translations at the quality of
      the sibling namespaces (Kader / plantilla / effectif, etc.); keep the
      `{{owned}}` / `{{needed}}` / `{{track}}` interpolation tokens.
- [x] 6.4 Register `salvageRun` in `shared/config/i18n/i18next.d.ts`.
- [x] 6.5 Update `tabs.salvage-runDescription` in `public/locales/*/dailies.json`
      to describe the recommendations page.
- [x] 6.6 Extend `pages/dailies/model/team-translations.test.ts` with a
      `salvageRun` row (leaf-key parity across en/de/es/fr; token spot-checks;
      the nine-step tour key list).
- [x] 6.7 Update `dailies-tutorial.test.tsx` / `dailies-layout.test.tsx`: mock
      `use-salvage-recommendations`, move `salvage-run` out of the
      "routes to placeholder" list, and assert `/dailies/salvage-run` renders
      `salvage-run-page`.

## 7. Full verification

- [x] 7.1 `pnpm --filter web exec vitest run src/fsd/pages/dailies` — green.
- [x] 7.2 `pnpm --filter web typecheck` — 0 errors.
- [x] 7.3 `pnpm --filter web lint` (eslint + knip) — clean; delete any now-unused
      export knip flags.
- [x] 7.4 `pnpm --filter web lint:fsd` — no new steiger violation.
- [x] 7.5 `pnpm test:run` — full suite green; account for the added tests against
      the baseline count.
- [x] 7.6 `pnpm format` and `git diff --check` — clean.
- [x] 7.7 `openspec validate add-dailies-salvage-run --strict` — passes.

## 8. Manual verification

- [x] 8.1 Against the running Aspire stack (Chrome "Browser 2", signed in as
      Severyn Display, real synced roster — 44 Imperial / 23 Chaos / 33 Xenos
      owned): the page renders at `/dailies/salvage-run` with the alliance-track
      selector (icons) beside the mode / project / size / preference controls.
      Imperial → Plan {Bellator, Arjac, Ragnar, Celestine}, Random {Helbrecht,
      Cezare, Azrael, Sarquael, Incisus} — all Imperial. Switching to Chaos
      re-teams both cards to all-Chaos ({Ahriman, Abraxas, ...}); switching to
      Xenos re-teams both to all-Xenos. Preferred trait "Synapse" on the Xenos
      track fills four Synapse Tyranids in the Plan Team and tops up the fifth
      slot with a non-matching Xenos character ("Added to complete the team") —
      never an off-alliance character; the trait options are scoped to the
      selected track's roster. Power mode + the trait + the track all persist
      under `tp.dailies.salvage.*` and survive a full reload; the Arena page's
      `tp.dailies.arena.*` keys are untouched. No console errors on load or
      interaction. Test localStorage keys cleared afterwards. - Not exercised live: the per-track insufficient-roster state (every track
      this account owns has ≥3 characters) — covered by
      `use-salvage-recommendations.test.tsx` and `salvage-run-page.test.tsx`. - Not exercised live: the sub-768px header layout — `resize_window` has no
      effect in this browser setup (same gap noted in Change 1); the header
      controls share one markup at every breakpoint and are covered by the
      automated desktop/mobile parity test.
