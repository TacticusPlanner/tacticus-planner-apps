## Why

On mobile the Raid Bosses list is a wrapping grid of ~45 portrait tiles in two
flat sections (Bosses, Primes) that pushes the detail view far down the page and
gives no way to search. The character/MoW lookups already solved this with a
searchable, grouped Select (`UnitCombobox`). Raid bosses should get the same
control, grouped so each boss sits with the primes it is fought alongside rather
than in a separate undifferentiated Primes list.

## What Changes

- **Mobile list → searchable Select.** Below 768px the portrait grid is replaced
  by a Popover + Command combobox: a trigger showing the selected entity's
  portrait and name, a search field, and a scrollable grouped list. Selecting an
  option navigates to that entity's detail, same as tapping a tile does today.
- **Grouped by boss, not by section.** The list is grouped one group per boss, in
  the catalog's served boss order. Each group's heading is the boss name; its
  members are the boss entry followed by the primes fought alongside it (the
  primes referenced by that boss's encounter sets' `Crystal` encounters, deduped
  and in encounter order). Every prime is expected to be referenced by exactly
  the boss(es) it fights with; the served dataset is assumed to cover all primes.
- **Mobile tour.** The mobile tour's two steps that point at the removed
  `raid-boss-list-bosses` / `raid-boss-list-primes` sections collapse into one
  step anchored to the picker.
- **Desktop is unchanged** — it keeps the two-section portrait grid beside the
  detail.

No change to routing, selection state, the detail view, modifier math, portrait
resolution, or the desktop layout. No API change — frontend repo only, no
companion `tacticus-planner-api` change.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `raid-boss-library`: the **Raid Bosses list shows Bosses and Primes as two
  sections** requirement is scoped to desktop and gains the mobile grouped-Select
  form; **Desktop and mobile present distinct layouts** updates the mobile list
  description; **The page has an onboarding tour covering both platforms** updates
  what the mobile entity-selection step anchors to.

## Impact

- New `apps/web/src/fsd/pages/library/ui/raid-bosses/mobile/raid-boss-mobile-picker.tsx`
  (Popover + Command, `RaidBossPortrait` for the avatar/badge, own `data-testid`).
- `mobile/raid-bosses-mobile-page.tsx` — renders the picker instead of
  `RaidBossList`; `RaidBossList` stays as the desktop-only component.
- New entity helper (e.g. `buildRaidBossRosterGroups(payload)` →
  `{ boss, primes }[]` in served order) on `@/entities/raid-boss`, consumed via
  the catalog hook; a new `rosterGroups` prop threaded through
  `raid-bosses-page.view-model.ts` to the mobile sub-page only.
- `raid-bosses.tutorial.tsx` — mobile step set; new/reused `tour.raidBosses.steps.*`
  i18n key for the picker step.
- `apps/web/public/locales/{en,de,es,fr}/library.json` — picker placeholder /
  empty-search strings and the tour step copy; full de/es/fr parity.
- Tests: `raid-bosses-page.test.tsx`, `raid-bosses.tutorial.test.tsx`, a unit
  test for the grouping helper, and a picker component test.
