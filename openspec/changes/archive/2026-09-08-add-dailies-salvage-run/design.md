# Design — Salvage Run recommendations

## Context

Change 1 extracted the game-mode-agnostic engine
(`pages/dailies/model/team-recommendations.ts` + `team-eligibility.ts` +
`team-recommendations.types.ts`) and moved every presentational piece into
`pages/dailies/ui/team-recs/` with a `testIdPrefix` prop. Arena is already a
thin config: `buildArenaRecommendations` builds two `TeamPoolSpec`s and calls
`buildTeamRecommendations`. Salvage Run is the same shape plus:

1. a **track** (one of three alliances) that pre-filters the roster, and
2. a **per-track insufficient-roster** state that Arena has no analogue for.

The engine already intersects every pool and its implicit full-roster pool with
the roster it is handed, so **passing a roster already narrowed to one alliance
makes every pool — including the widest — alliance-safe with no engine change.**

## Decisions

### D1 — Track narrowing happens in the hook, not the engine

`useSalvageRecommendations` reads `getCharactersMap()` (already used by Arena for
traits/damage types) and additionally takes each view's `alliance`. It filters
the synced roster to `alliance === track` **before** calling
`buildSalvageRecommendations`, which is otherwise identical to
`buildArenaRecommendations`. The engine stays untouched; the
`dailies-team-recommendations` capability already says "The engine SHALL NOT
re-add a character the caller excluded."

### D2 — Persisted controls: generic helper, per-page keys

`use-arena-recommendations.ts` currently owns `usePersistedArenaMode`,
`usePersistedTeamSize`, `usePersistedArenaPreferences`, each hard-coding a
`tp.dailies.arena.*` key. Factor the storage/parse/merge logic into
`pages/dailies/model/team-recommendation-prefs.ts`:

- `usePersistedMode(storageKey)` → `[TeamMode, (m) => void]`
- `usePersistedTeamSize(storageKey)` → `[number, (n) => void]`
- `usePersistedPreferences(storageKey)` → `[TeamPreferences, (patch) => void]`

Arena keeps its three named wrappers, now one-liners delegating with the
existing `tp.dailies.arena.*` keys — **no key change, no behaviour change**, so
`use-arena-recommendations.test.tsx` passes unmodified. Salvage Run calls the
generics with `tp.dailies.salvage.{mode,teamSize,preferences}` and
`usePersistedSalvageTrack()` (its own tiny wrapper, key
`tp.dailies.salvage.track`, default `"Imperial"`, validated against the three
track alliances).

### D3 — View-model union gains one variant

`SalvageRecommendationsViewModel` mirrors `ArenaRecommendationsViewModel` (ready
carries `track` + `setTrack` on top of Arena's fields) and adds:

```ts
| { status: "insufficient-track"; track: SalvageTrack; ownedCount: number;
    needed: number; eligible: TeamMember[] }
```

`eligible` is built in the hook from the track roster via
`progressionRarity(progression)` + `rank`, reusing `TeamMember` so the existing
`TeamList` renders it. `needed = MIN_TEAM_SIZE - ownedCount`.

### D4 — UI: reuse everything in `team-recs/`, add two components

- `ui/salvage-run/salvage-run-page.tsx` — copy of `arena-page.tsx` with
  `testIdPrefix="salvage"`, a `<AllianceTrackSelector>` first in the header row,
  and an `insufficient-track` branch rendering `<TrackShortfall>`.
- `ui/salvage-run/track-selector.tsx` — `<AllianceTrackSelector>`, a `Tabs`
  triplet like `mode-toggle.tsx`, icon per track from `onslaughtAllianceIcon`,
  `data-testid="salvage-track-selector"`, track labels from `salvageRun:track.*`.
- `ui/salvage-run/desktop/salvage-desktop.tsx` + `mobile/salvage-mobile.tsx` —
  thin mirrors of the Arena equivalents that pass `testIdPrefix="salvage"` to
  `<TeamCategorySection>`.
- `ui/team-recs/track-shortfall.tsx` — shared (Onslaught will reuse it): the
  shortfall copy from `salvageRun:track.*` (interpolating `owned`, `needed`,
  `track`) plus a `<TeamList>` of the eligible members. `data-testid`
  `${testIdPrefix}-insufficient-track`.
- `ui/salvage-run/salvage-run-page.tutorial.tsx` — `useSalvageRunTutorial`,
  namespace `salvageRun`, nine steps (Arena's eight + a `track` step second),
  desktop === mobile.

### D5 — i18n

New `salvageRun.json` (en/de/es/fr): `title`, `subtitle`,
`track.{label,imperial,chaos,xenos,shortfallTitle,shortfall}`,
`tour.salvageRun.steps.*`. Everything else (`mode.*`, `teamSize.*`,
`preferences.*`, `category.*`, `lock.*`, `regenerate`, `rationale.*`,
`state.{error,retry}`) comes from the existing `teamRecs` namespace. Register
`salvageRun` in `i18next.d.ts`. Update `dailies.json` `tabs.salvage-runDescription`
in every locale. `salvageRun` is lazy-loaded (not added to the `i18n.ts`
preload list) exactly like `arena`.

### D6 — Routing & tests

`route.tsx`: lazy `SalvageRunPage`, drop `"salvage-run"` from the placeholder
`map` (leaving `onslaught`, `guild-raids`). `dailies-tutorial.test.tsx` /
`dailies-layout.test.tsx`: move `salvage-run` from the "routes to placeholder"
list to its own "routes to the Salvage Run page" assertion, and mock
`use-salvage-recommendations` alongside `use-arena-recommendations`.

## Risks

- **Alliance field freshness** — a stale cached catalog row without `alliance`
  would drop a character from every track. `characterViewSchema.alliance` is a
  required enum (not `.optional()`), and the catalog is gated globally before
  the page mounts, so a row either has a valid alliance or the whole catalog
  read fails into the page's error state. No extra guard needed.
- **`resize_window` can't drive a sub-768px check in this environment** (seen in
  Change 1). The header controls share one markup at every breakpoint and are
  covered by the automated desktop/mobile parity test; note the visual
  phone-width check as the residual gap if it can't be run.
