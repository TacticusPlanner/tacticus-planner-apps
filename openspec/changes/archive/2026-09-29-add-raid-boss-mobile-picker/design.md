## Context

See `proposal.md` — Why. `RaidBossList` (`raid-boss-list.tsx`) is currently
rendered by both `desktop/raid-bosses-desktop-page.tsx` and
`mobile/raid-bosses-mobile-page.tsx`. The page orchestrator
(`raid-bosses-page.tsx`) already computes `bosses` / `primes`
(`RaidBossListItem[]` = `{ unitSetId, kind, name, factionId, isPrimarch,
portraitSrc }`) and a `portraitById: Map<string,string>` from the catalog hook,
and passes flat props via `RaidBossesPageViewProps`.

The boss↔prime relationship is derivable the same way `buildModifierContext` /
`buildAdjustedView` already do it: for a boss, the sets across
`seasons[*].tiers[*].sets[*]` that contain a boss encounter for it, and the
`Crystal` encounters in those sets name its primes.

The character/MoW lookups use `shared/ui/unit-combobox.tsx` (`UnitCombobox`) —
Popover + cmdk `Command` with `shouldFilter={false}` and a stable
case-insensitive substring filter, `CommandGroup` per group, a fixed-size avatar
slot. It is typed to `FactionGroup` / `UnitId` from `@workspace/game-domain`.

## Goals / Non-Goals

**Goals:**

- Mobile roster is one searchable, grouped combobox; parity of look/behaviour
  with the character picker.
- Grouping is boss → [boss, ...its primes], served boss order.
- Desktop untouched.

**Non-Goals:**

- No change to `RaidBossList` (desktop keeps it), routing, selection state,
  detail view, or portrait resolution.
- Not generalising `UnitCombobox` to non-`UnitId` ids (see Decision 2).
- No "loose primes" bucket — the dataset is assumed to reference every prime
  (user decision); an unreferenced prime is treated as a data bug, not a
  supported UI state.

## Decisions

### 1. New entity helper for the grouping

Add `buildRaidBossRosterGroups(payload: RaidBossesPayload):
{ boss: RaidBoss; primes: RaidBoss[] }[]` to `@/entities/raid-boss` (lib +
barrel), ordered by `payload.bosses`. For each boss, walk the sets that hold one
of its encounters, collect `Crystal` encounter `unitSetId`s in encounter order,
dedupe, map through `primeById`. Pure, unit-testable, and colocated with the
existing `encounters.ts` resolvers it mirrors.

The catalog hook (`use-raid-bosses-catalog.ts`) calls it and exposes
`rosterGroups: { boss: RaidBossListItem; primes: RaidBossListItem[] }[]`
(list-item shaped, portraits already attached). `raid-bosses-page.tsx` threads it
into `RaidBossesPageViewProps` as `rosterGroups`; only the mobile sub-page reads
it. Alternative (rejected): compute in the mobile picker from `bosses` + `primes`

- raw payload — pushes season-shape knowledge into a page UI component.

### 2. Page-local `RaidBossMobilePicker`, not a generalised `UnitCombobox`

`UnitCombobox` is typed to `UnitId` and `FactionGroup`; raid-boss `unitSetId`s
are plain strings. Widening it to a generic id type touches a component shared by
Goals, Character Lookup and MoW Lookup for one caller's benefit. Instead add
`mobile/raid-boss-mobile-picker.tsx` — the same Popover + `Command` skeleton
(`shouldFilter={false}`, stable substring filter, portal-into-Sheet handling
copied), `CommandGroup` per boss group, `CommandItem` per member. Use the
entity's existing `RaidBossPortrait` for the trigger and item avatars (it already
does the img→initials-badge fallback), so no dependency on `UnitCombobox`'s
private `ComboboxAvatar`.

Filtering: a boss-name match keeps the whole group (matches
`UnitCombobox.filteredGroups`); otherwise filter members by name. Group order and
member order stay fixed.

`data-testid="raid-boss-mobile-picker"` on the trigger for the tour + tests.

### 3. Tour: collapse the two mobile roster steps into one

`raid-bosses.tutorial.tsx` `mobile` set currently has `bosses` and `primes` steps
both anchored to `raid-boss-list-*` testids that no longer render on mobile. Add a
`mobilePicker` shared step (`target: '[data-testid="raid-boss-mobile-picker"]'`,
new keys `tour.raidBosses.steps.mobilePicker.title/content`) and use it in place
of `bosses` + `primes` in the `mobile` array only. Desktop keeps both.
`raid-bosses.tutorial.test.tsx` asserts per-set targets — update the mobile
expectation.

## Risks / Trade-offs

- **A prime referenced by no boss set → missing from the mobile picker** → Per
  the user decision this is out of scope to handle in UI; the helper simply
  won't place it. It stays reachable by URL and appears on desktop. A dev-time
  invariant check (all `payload.primes` covered) can live in the helper's test,
  not runtime.
- **A prime shared by multiple bosses (e.g. a Tervigon variant's Warrior) would
  list under each** → In the served data each boss variant has its own prime
  variant, so groups don't overlap in practice; if they did, showing the prime
  under each relevant boss is the desired behaviour for a finder, not a bug.
- **cmdk list height with ~45 items + ~16 group headers** → same order of
  magnitude as the character picker (100+); `CommandList` scrolls. No
  virtualisation needed.
- **Duplicated Popover/Command skeleton** (~60 lines shared with
  `UnitCombobox`) → accepted over destabilising a shared component; if a third
  raid-boss-style combobox appears, extract a generic then.
