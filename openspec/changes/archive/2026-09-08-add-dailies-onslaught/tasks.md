## 1. Shared track-scaffolding reuse

- [x] 1.1 Move `pages/dailies/ui/salvage-run/track-selector.tsx` to
      `pages/dailies/ui/team-recs/track-selector.tsx` unchanged; update the one
      import in `salvage-run-page.tsx`. Keep `data-testid` behaviour: the wrapper
      testid and per-trigger testids are passed in by the caller
      (`salvage-track-selector` / `onslaught-track-selector`).
- [x] 1.2 Add `usePersistedTrack(storageKey)` to
      `pages/dailies/model/team-recommendation-prefs.ts` — the storage / validate
      logic from `usePersistedSalvageTrack`, parameterized by key, validated with
      `isSalvageTrack`. Reduce `usePersistedSalvageTrack` in
      `use-salvage-recommendations.ts` to a one-line wrapper with
      `tp.dailies.salvage.track`. Verify `use-salvage-recommendations.test.tsx`
      passes unchanged.

## 2. Engine: Onslaught-goal rationale + leading pool

- [x] 2.1 `pages/dailies/model/team-recommendations.types.ts`: add
      `{ kind: "onslaught-goal"; goalId: string; projectId?: string }` to
      `TeamMemberRationale`.
- [x] 2.2 `pages/dailies/ui/team-recs/team-list.tsx`: add
      `case "onslaught-goal": return t("rationale.onslaughtGoal")` to
      `rationaleText` (the `switch` is exhaustive — no `default`).
- [x] 2.3 `pages/dailies/model/arena-recommendations.ts`: add an optional
      `leadingPools?: readonly TeamPoolSpec[]` to `BuildArenaRecommendationsInput`
      and prepend it to the `pools` array in `buildArenaRecommendations` (default
      `[]`; Arena and Salvage Run call sites unchanged).
- [x] 2.4 `pages/dailies/model/team-recommendations.test.ts`: a pool supplying an
      `onslaught-goal` rationale surfaces it on the member; the exhaustive
      `rationaleFor` still returns pool rationale unchanged for other kinds.
- [x] 2.5 `pages/dailies/model/arena-recommendations.test.ts`: `leadingPools`
      entries rank ahead of `active-project` / `overall-goals` in XP mode and are
      absent-safe when omitted.

## 3. Onslaught engine config

- [x] 3.1 Create `pages/dailies/model/onslaught-recommendations.types.ts`:
      re-export `SalvageTrack` / `SALVAGE_TRACKS` / `isSalvageTrack` as the
      Onslaught track type; `OnslaughtAscensionGoal`
      (`{ unitId; goalId; projectId?; entityType: "Character" | "Mow" }`);
      `BuildOnslaughtRecommendationsInput` (Salvage's input + `onslaughtGoalUnitIds` + per-unit goal metadata for the pool rationale);
      `OnslaughtRecommendationsViewModel` (Salvage's ready fields + `shardRecipient`).
- [x] 3.2 Create `pages/dailies/model/onslaught-recommendations.ts`:
      `buildOnslaughtRecommendations(input)` — filter roster to the track's
      alliance, build the `onslaught-ascension` `TeamPoolSpec` (unit ids that are
      Character-targeted Onslaught Ascension goals of the track, `rationaleFor` →
      `{ kind: "onslaught-goal", goalId, projectId }`), pass it as `leadingPools`
      to `buildArenaRecommendations` with the same `active-project` /
      `overall-goals` config as Salvage Run.
- [x] 3.3 Create `onslaught-recommendations.test.ts`: the Onslaught-goal
      character leads the XP-mode Plan Team ahead of project / goal contributors
      with the `onslaught-goal` rationale; a MoW-targeted Onslaught goal never
      enters the team; the pool widens like any other; off-alliance excluded;
      Power mode ranks by power (pool only seeds widening).

## 4. Shard recipient service

- [x] 4.1 Create `pages/dailies/model/onslaught-shard-recipient.ts`:
      `recommendOnslaughtShardRecipient(input)` per design Decision 4 — filter
      Active Ascension goals to the track's alliance + Onslaught acquisition
      source + `calculateGoalResourceNeed` outstanding shards `> 0`; rank by
      (in-selected-project, project goal priority, overall goal order, remaining
      shards ascending, goalId); return `{ status: "none" }` or
      `{ status: "ready"; recipient; alternates }` with `currentRarity`,
      `targetRarity`, `currentShards`, `requiredShards`, `remainingShards`,
      `unitKind`, `goalId`, `projectId?`, `reason`.
- [x] 4.2 Create `onslaught-shard-recipient.test.ts`: no eligible goal →
      `none`; a MoW goal can win; selected-project goal beats a non-project goal;
      within the project, lower `priority` wins; outside the project, earlier
      `overallGoalOrder` wins; equal priority → fewer remaining shards wins;
      a goal already at target rarity is excluded; mythic-tier goal counts
      `mythicShards`; `reason` reflects the decisive rank.

## 5. Onslaught hook

- [x] 5.1 Create `pages/dailies/model/use-onslaught-recommendations.ts`: the
      Salvage Run hook's data set (roster, catalog, `goalQueries.list(false)`,
      `projectQueries.goals`) plus `getPlayerMows()`, `getMowsMap()`,
      `getAscensionCostsMap()` live queries and a `useQueries` over
      `goalQueries.detail(goalId)` for `goalType === "Ascension"` summaries only.
      Persisted controls under `tp.dailies.onslaught.*` (`usePersistedTrack`,
      `usePersistedMode`, `usePersistedTeamSize`, `usePersistedPreferences`).
- [x] 5.2 Derive the Onslaught-goal pool inputs and the shard-recipient inputs
      from the resolved `GoalDetail[]`: characters of the track feed
      `buildOnslaughtRecommendations`; characters + MoWs feed
      `recommendOnslaughtShardRecipient` with the selected project's goal-priority
      map (from `projectQueries.goals`) and the overall goal order (from
      `goalQueries.list`).
- [x] 5.3 View-model branches: `loading` (any query / detail query pending,
      roster / catalog / mows / ascension costs missing), `error` (any failed)
      with `retry`, `insufficient-track` (`trackRoster.length < MIN_TEAM_SIZE` —
      carries the Salvage fields **plus** `shardRecipient`), else `ready` with
      `recommendations`, `shardRecipient`, `track` / `setTrack`, and the Salvage
      ready fields.
- [x] 5.4 Create `use-onslaught-recommendations.test.tsx` (mirror the Salvage
      hook test): track default / round-trip / bad value under
      `tp.dailies.onslaught.track`; mode + size independent of
      `tp.dailies.{arena,salvage}.*`; `insufficient-track` still carries
      `shardRecipient`; Ascension detail pending → `loading`; detail failed →
      `error`; `ready` exposes the recipient; switching track re-computes both.

## 6. Shard recipient UI

- [x] 6.1 Create `pages/dailies/ui/onslaught/shard-recipient-panel.tsx`:
      `<ShardRecipientPanel result testIdPrefix="onslaught">` — a Card with
      `onslaught:recipient.title`; the `none` state renders
      `onslaught:recipient.none`; the `ready` state shows portrait + name, a
      unit-kind badge (`recipient.unitKind.*`), current → target rarity
      (`RarityIcon`), current / required / remaining shard counts, the project
      and goal, and the translated `recipient.reason.*`. `data-testid`
      `onslaught-shard-recipient`.
- [x] 6.2 Create `shard-recipient-panel.test.tsx`: `none` copy; `ready` renders
      the unit name, both rarities, the three shard numbers, and the reason;
      MoW kind badge shown for a MoW recipient.

## 7. Onslaught page + tour

- [x] 7.1 Create `pages/dailies/ui/onslaught/desktop/onslaught-desktop.tsx` and
      `mobile/onslaught-mobile.tsx` — mirrors of the Salvage layouts passing
      `testIdPrefix="onslaught"`, each rendering `<ShardRecipientPanel>` above the
      team sections (shown in the insufficient-track branch too); `data-testid`
      `onslaught-desktop` / `onslaught-mobile`.
- [x] 7.2 Create `pages/dailies/ui/onslaught/onslaught-page.tsx` — copy of
      `salvage-run-page.tsx` with `useTranslation(["onslaught", "teamRecs"])`,
      `testIdPrefix="onslaught"`, `<AllianceTrackSelector>` first in the header
      (wrapper testid `onslaught-track-selector`), the `insufficient-track`
      branch rendering `<TrackShortfall testIdPrefix="onslaught">` **and**
      `<ShardRecipientPanel>`. `data-testid="onslaught-page"`.
- [x] 7.3 Create `pages/dailies/ui/onslaught/onslaught-page.tutorial.tsx`:
      `useOnslaughtTutorial`, namespace `onslaught`, steps
      `purpose, track, mode, project, teamSize, preferences, plan, shardRecipient,
    locks, regenerate` targeting the `onslaught-*` test ids; desktop === mobile.
- [x] 7.4 Create `onslaught-page.test.tsx` and `onslaught-page.tutorial.test.tsx`
      (mirror the Salvage page + tutorial tests): renders the track selector +
      both categories + the shard recipient panel; switching the track calls
      `setTrack` and re-renders the recipient; the `insufficient-track` panel
      shows the shortfall **and** the recipient and no category sections;
      desktop/mobile parity; all ten tour targets resolve.

## 8. Routing & i18n

- [x] 8.1 `pages/dailies/route.tsx`: add a lazy `OnslaughtPage` route for
      `onslaught`; drop `"onslaught"` from the placeholder `map`.
- [x] 8.2 Create `apps/web/public/locales/en/onslaught.json` — `title`,
      `subtitle`, `track.{label,imperial,chaos,xenos}`,
      `recipient.{title,none,unitKind.{character,mow},currentRarity,targetRarity,
    shards,required,remaining,project,goal,reason.{onlyCandidate,inSelectedProject,
    overallGoalPriority,fewestRemainingShards}}`,
      `tour.onslaught.steps.{purpose,track,mode,project,teamSize,preferences,plan,
    shardRecipient,locks,regenerate}.{title,content}`.
- [x] 8.3 Add real de / es / fr `onslaught.json` at the quality of the sibling
      namespaces; keep every interpolation token.
- [x] 8.4 Add `rationale.onslaughtGoal` to `public/locales/{en,de,es,fr}/teamRecs.json`.
- [x] 8.5 Register `onslaught` in `shared/config/i18n/i18next.d.ts`.
- [x] 8.6 Update `tabs.onslaughtDescription` in `public/locales/*/dailies.json`
      to describe the recommendations page.
- [x] 8.7 Extend `pages/dailies/model/team-translations.test.ts` with an
      `onslaught` row (leaf-key parity across en/de/es/fr; token spot-checks; the
      ten-step tour key list) and a `teamRecs.rationale.onslaughtGoal` presence
      check.
- [x] 8.8 Update `dailies-tutorial.test.tsx` / `dailies-layout.test.tsx`: mock
      `use-onslaught-recommendations`, move `onslaught` out of the "routes to
      placeholder" list, assert `/dailies/onslaught` renders `onslaught-page`.

## 9. Full verification

- [x] 9.1 `pnpm --filter web exec vitest run src/fsd/pages/dailies` — green.
- [x] 9.2 `pnpm --filter web typecheck` — 0 errors.
- [x] 9.3 `pnpm --filter web lint` (eslint + knip) — clean; delete any now-unused
      export knip flags.
- [x] 9.4 `pnpm --filter web lint:fsd` — no new steiger violation.
- [x] 9.5 `pnpm test:run` — full suite green; account for the added tests against
      the baseline count.
- [x] 9.6 `pnpm format` and `git diff --check` — clean.
- [x] 9.7 `openspec validate add-dailies-onslaught --strict` — passes.

## 10. Manual verification

- [x] 10.1 Verified against the running Aspire stack (Chrome, signed in as
      Severyn Display, real synced roster): `/dailies/onslaught` renders with the
      alliance-track selector beside the mode / project / size / preference
      controls and the shard-recipient panel above the teams. Imperial → Plan
      {Bellator, Arjac (selected project), Ragnar, Celestine (active goal),
      Helbrecht (added to complete)}, Random {Helbrecht, Cezare, Azrael,
      Sarquael, Incisus} — all Imperial, with the "widened beyond its own pool"
      note. Switching to Chaos re-teams both cards to all-Chaos ({Ahriman,
      Abraxas, Angrax, Maladus, Nauseous} / {Yazaghor, Tarvakh, Ahriman, Shiron,
      Azkor}); switching back to Imperial re-teams to Imperial. The track
      persists under `tp.dailies.onslaught.track` and survives a full reload
      (reloaded on Chaos, stayed Chaos). No console errors on load or
      interaction.
- [x] 10.2 Not exercised live — the test account has no active Onslaught-farming
      Ascension goal, so the shard-recipient panel showed its "No shard target is
      configured for this track" state on every track (this `none` state was
      verified live). Covered by automated tests instead: - the `ready` shard recipient (character and Machine of War), its ranking,
      and the current / required / remaining shard figures —
      `onslaught-shard-recipient.test.ts`, `use-onslaught-recommendations.test.tsx`,
      `onslaught-page.test.tsx`; - the "Onslaught Ascend goal" Plan Team lead and rationale —
      `onslaught-recommendations.test.ts`, `team-recommendations.test.ts`,
      `arena-recommendations.test.ts`; - the per-track insufficient-roster state (every alliance this account owns
      has ≥ 3 characters) — `use-onslaught-recommendations.test.tsx`,
      `onslaught-page.test.tsx`; - the sub-768px header layout (`resize_window` is a no-op in this browser
      setup, as in Changes 1 & 2) — the header controls share one markup at
      every breakpoint and the desktop/mobile parity test covers the team
      sections and the shard-recipient panel.
