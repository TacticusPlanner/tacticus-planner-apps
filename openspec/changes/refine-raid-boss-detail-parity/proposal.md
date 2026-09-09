## Why

A V1-vs-V2 walkthrough of the raid-boss detail view (`learn/guildBossDetail` → `/library/raid-bosses/{id}`)
found three places where the shipped V2 view is harder to read than V1 or is
internally inconsistent. All three are display-only gaps in an already-shipped
feature; the underlying data and modifier math are correct.

## What Changes

- **Progression step selector — label parity with V1.** Each step option currently
  reads `Step 19/27 · Legendary · ★9`. V1 labels the same option `Legendary 2`
  (the in-game rarity tier plus its 1-based index within that rarity) and shows
  the step's total health. The V2 option label gains the rarity-tier name and the
  step's total health so a reader can pick "Legendary 2" and see its HP without
  first selecting it.
- **HP-lost framing — one unit across the modifier section.** The "Prime Modifiers"
  panel labels thresholds as a percentage (`At 25% HP lost`); the "Adjusted stats"
  HP-lost selector on the same screen labels the same points as an absolute
  (`150,000 / 600,000 HP lost`). The Adjusted-stats selector switches to the same
  percentage framing as the panel so the two lists read as one schedule.
- **Adjusted stat block — show the full stat set.** The adjusted-stats table only
  renders rows a modifier touches (often just Damage), so at most points it is a
  one-row table. V1 always shows Health / Armour / Damage / Movement. The V2 table
  lists the full stat set (health, damage, armor, movement, plus crit/block when
  the step carries them), each with its base and adjusted value, whether or not a
  modifier changes it.

No behavior change to modifier math, stat values, ability-text resolution, portrait
resolution, routing, or the tour. No API change — this is the frontend repo only,
with no companion `tacticus-planner-api` change.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `raid-boss-library`: the **detail view shows progression-stepped stats**
  requirement gains a constraint on the step-selector option label (rarity tier
  name + total health). The **detail view previews stats adjusted by active
  modifiers** requirement changes the HP-lost point control to a percentage label
  consistent with the Prime Modifiers panel, and requires the adjusted stat block
  to list the full stat set with base and adjusted values rather than only the
  modifier-touched rows.

## Impact

- `apps/web/src/fsd/pages/library/ui/raid-bosses/raid-boss-detail.tsx` — progression
  `SelectItem` label; the shared component serves both desktop and the `compact`
  mobile form.
- `apps/web/src/fsd/pages/library/ui/raid-bosses/raid-boss-adjusted-stats.tsx` —
  HP-lost selector label; `affectedRows` stops filtering to touched stats and adds
  a health row.
- `apps/web/public/locales/{en,de,es,fr}/library.json` — one new/changed
  `raidBosses.*` key for the percentage HP-lost option label and the
  rarity-tier progression label; full de/es/fr parity.
- Tests: `raid-bosses-page.test.tsx`, `raid-boss-adjusted-stats.test.tsx`.
- A rarity-tier-index helper (`Legendary 2` from a step's `baseRarity` and its
  position in `statProgression`) — small, page-local unless an entity helper
  already fits.
