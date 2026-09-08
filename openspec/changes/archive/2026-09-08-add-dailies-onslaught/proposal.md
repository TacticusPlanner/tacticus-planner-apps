## Why

Onslaught (issue #78) needs the same per-alliance-track team recommendations
Salvage Run already produces, plus two Onslaught-specific additions: a
highest-priority candidate pool for characters the player is ascending through
Onslaught shard farming, and a separate **post-battle shard recipient**
recommendation (which may be a Machine of War and is not a battle-team slot).
The shared `dailies-team-recommendations` engine and the Salvage Run track
scaffolding already cover everything else, so Onslaught is a thin page-level
configuration plus one new domain service.

## What Changes

- New `/dailies/onslaught` page replacing the "Under Construction" placeholder,
  mirroring the Salvage Run page: one **Plan Team** and one **Random Team**, an
  XP / Power mode toggle, the shared Dailies project selector, a Team size
  (3–5) control, the Preferred trait / Preferred damage type controls, a
  page-level **alliance track selector** (Imperial / Chaos / Xenos) that narrows
  every recommendation to the owned characters of that alliance before any other
  prioritization, and the per-track **insufficient roster** state.
- The Plan Team gains a new **highest-priority candidate pool**: owned
  characters of the track's alliance that are the target of an active
  **Ascension** goal whose shard farming sources include **Onslaught** and whose
  target rarity is not yet reached. Members chosen from this pool show an
  "Onslaught Ascend goal" rationale, ranked ahead of the active-project and
  overall-goals pools.
- A new **post-battle shard recipient** panel, computed by a separate
  `onslaught-shard-recipient` domain service (not part of the team engine):
  for the selected track it ranks the eligible characters **and Machines of
  War** with an active Onslaught-farming Ascension goal and outstanding shards
  by active-project priority, then project goal priority, then overall goal
  priority, then remaining shards, and recommends the top one — showing its
  name, unit type, current and target rarity, current / required / remaining
  shard counts, its project and goal, and the reason. When the track has no
  eligible goal, the panel says no shard target is configured rather than
  inventing one. The panel renders even when the battle team is incomplete.
- The mode, team size, and preference selections are persisted per browser
  under `tp.dailies.onslaught.*` keys; the selected track under
  `tp.dailies.onslaught.track`. All independent of Arena and Salvage Run.
- New `onslaught` i18n namespace for the page title, track labels, the shard
  recipient panel copy, and the tour; shared control / state / rationale copy
  continues to come from `teamRecs`.
- New Joyride tour for the page (`tour.onslaught.*`), desktop and mobile.
- The Home Screen Event team category the issue also describes is **out of
  scope** here — it is tracked separately (#111) and will be added to Arena,
  Salvage Run, and Onslaught together as one shared pool.

No `tacticus-planner-api` companion change: alliance is already on
`characterViewSchema` and `mowSchema`; goal `acquisitionSources`, ascension /
unlock shard costs, Onslaught rewards, and player shard inventory are all
already available client-side (the Shops recommendations page uses the same
data).

## Capabilities

### New Capabilities

- `dailies-onslaught-recommendations`: the Onslaught page — its alliance track
  selector and persistence, the hard alliance restriction, the Onslaught-farming
  Ascension-goal priority pool feeding the Plan Team, the separate post-battle
  shard-recipient recommendation (characters and Machines of War), the per-track
  insufficient-roster state, and its reuse of the shared engine, mode, size,
  preference, and presentation behaviour.

### Modified Capabilities

- `dailies-team-recommendations`: the pool rationale a priority pool may supply
  gains an "Onslaught Ascend goal" variant, and the shared team presentation
  renders it as a distinct selection reason.
- `dailies-navigation`: the placeholder-tabs requirement no longer lists
  Onslaught (or Salvage Run) as an Under Construction tab — only Guild Raids
  remains a placeholder.

## Impact

- **New code**:
  `apps/web/src/fsd/pages/dailies/model/onslaught-recommendations.ts` (+
  `.types.ts`), `onslaught-shard-recipient.ts` (+ tests),
  `use-onslaught-recommendations.ts`, `ui/onslaught/` (page, desktop/mobile
  layouts, shard-recipient panel, tutorial).
- **Modified**: `pages/dailies/route.tsx` (drop the `onslaught` placeholder),
  `model/team-recommendations.types.ts` + `team-recommendations.ts` +
  `ui/team-recs/team-list.tsx` (the Onslaught-goal rationale variant),
  `shared/config/i18n/i18next.d.ts` (register `onslaught`),
  `public/locales/*/dailies.json` (Onslaught tab description),
  `public/locales/*/teamRecs.json` (the new rationale string),
  `dailies-tutorial.test.tsx` / `dailies-layout.test.tsx` (Onslaught now has a
  real page).
- **i18n**: new `onslaught.json` in en/de/es/fr; one added key in `teamRecs.json`.
- Reuses the shared `team-recs/track-shortfall.tsx` and the Salvage Run track
  selector (promoted to `ui/team-recs/` if not already shared).
- No API, schema, or dependency changes.
