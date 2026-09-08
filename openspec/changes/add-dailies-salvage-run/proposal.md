## Why

Salvage Run (issue #77) needs the same team recommendations Arena already
produces, but generated per **alliance track** (Chaos, Imperial, Xenos) with a
hard restriction: only characters of the track's alliance may appear. The shared
`dailies-team-recommendations` engine extracted in the previous change already
takes a pre-narrowed roster and an ordered pool list, so Salvage Run is a thin
page-level configuration over it plus a track selector and a per-track
insufficient-roster state — not a second copy of the recommendation logic.

## What Changes

- New `/dailies/salvage-run` page replacing the "Under Construction"
  placeholder, mirroring the Arena page: one **Plan Team** and one **Random
  Team**, an XP / Power mode toggle, the shared Dailies project selector, a
  Team size (3–5) control, and the Preferred trait / Preferred damage type
  controls.
- A page-level **alliance track selector** (Imperial / Chaos / Xenos) that
  narrows every recommendation to the owned characters of that alliance before
  any project, goal, XP, or power prioritization runs. The selected track is
  persisted per browser.
- A per-track **insufficient roster** state: when the player owns fewer than
  three characters of the selected alliance, the page lists the eligible
  characters, states that a full team cannot be generated, and shows how many
  more are needed — it never pads from another alliance.
- The mode, team size, and preference selections are persisted per browser
  under `tp.dailies.salvage.*` keys, independent of the Arena page's.
- New `salvageRun` i18n namespace for the page title, track labels, and tour;
  shared control / state / rationale copy continues to come from `teamRecs`.
- New Joyride tour for the page (`tour.salvageRun.*`), desktop and mobile.

No `tacticus-planner-api` companion change: alliance is already on
`characterViewSchema` in `@workspace/game-catalog`, and the recommendation
engine, project, and goal data are all client-side.

## Capabilities

### New Capabilities

- `dailies-salvage-run-recommendations`: the Salvage Run page — its alliance
  track selector and persistence, the hard alliance restriction on every
  recommendation, the per-track insufficient-roster state, and its reuse of the
  shared engine, mode, size, preference, and presentation behaviour.

### Modified Capabilities

<!-- none: the shared dailies-team-recommendations engine already supports a
     pre-narrowed roster; no engine requirement changes. -->

## Impact

- **New code**: `apps/web/src/fsd/pages/dailies/model/salvage-recommendations.ts`
  (+ `.types.ts`), `use-salvage-recommendations.ts`, a generic persisted
  mode/size/preferences helper factored out of `use-arena-recommendations.ts`,
  `ui/salvage-run/` (page, track selector, desktop/mobile layouts, tutorial),
  and a shared `team-recs/track-shortfall.tsx`.
- **Modified**: `pages/dailies/route.tsx` (drop the `salvage-run` placeholder),
  `use-arena-recommendations.ts` (delegate its persistence hooks to the generic
  helper — same storage keys, no behaviour change),
  `shared/config/i18n/i18next.d.ts` (register `salvageRun`),
  `public/locales/*/dailies.json` (Salvage Run tab description),
  `dailies-tutorial.test.tsx` / `dailies-layout.test.tsx` (Salvage Run now has
  a real page).
- **i18n**: new `salvageRun.json` in en/de/es/fr.
- No API, schema, or dependency changes.
