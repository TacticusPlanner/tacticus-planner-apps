## 1. Calculator model

- [x] 1.1 Add `mow-upgrades.model.ts` with `calculateMowUpgrades` (steps, totals, materials; design D5) using `mowAbilityUpgradeIds` and `aggregateBaseUpgrades`; verify with unit tests for both worked examples in the spec (Galatian 1→3 / 1→2 and 49→51 / 49→49), From = To adding nothing, and materials sorted rarity desc then count.
- [x] 1.2 Add the owned-materials path (badges and components of the MoW's alliance, forge badges, inventory upgrades with crafted stock expanded, floors at 0, gold and salvage untouched); verify with the spec's "Inventory covers part of the need" example as a unit test.
- [x] 1.3 Build a V1 parity fixture from V1's `MowsService.getMaterialsList` + `MowLookupService` for Galatian, Biovore and Forgefiend over three ranges each, and verify `calculateMowUpgrades` matches it in a unit test.
- [x] 1.4 Add `useMowUpgradeRanges` (defaults From = player's level or 1, To = min(From + 10, max), To raised to From); verify with a hook test including the owned default (30 → 40, 28 → 38).

## 2. Shared unit components

- [x] 2.1 Extract `CharacterUnitHeader` into `ui/unit/unit-header.tsx` with `customControls`, `kindLine` and info-line props (design D2); verify the existing character unit page tests pass unchanged.
- [x] 2.2 Extract the characters list's grid and search into `ui/unit/unit-list.tsx`; verify the characters list tests pass unchanged.

## 3. Machines of War list

- [x] 3.1 Add `ui/mows/mows-list-page.tsx` and view-model (alliance → faction → name, localized-name search, no-match with clear, loading/failure/no-records states, origin written on tile click); verify with page tests including the "bio" → Biovore search.
- [x] 3.2 Point `/library/machines-of-war` at the list in `route.tsx` and stop redirecting it to the first MoW; verify with route and `use-library-route-selection` tests (list stays at the collection URL, NPCs still redirect).

## 4. MoW unit page

- [x] 4.1 Add `mow-unit-page.tsx`: loading, load failure, not found with a link to the list, `UnitNavBar` with breadcrumb and origin-based prev/next/position, `UnitTabs` with `details` / `upgrades`; point `/library/machines-of-war/:entityId` at it; verify with page tests (unknown id, `?tab=upgrades`, unknown tab → Details, prev/next keeps the tab, direct link back target).
- [x] 4.2 Add `useMowUnitValues` and the header wiring: owned (Your Machine of War line, no rank badge), not owned (grey portrait, Common, shard progress), no roster (banner), Custom with a progression select only, reset on MoW change; verify with page tests for the three states and Custom.
- [x] 4.3 Add `mow-unit-details.tsx`: Primary and Secondary `AbilityPanel`s with localized names, max level from `mow-upgrade-costs`, "Yours: level N"; desktop grid and mobile accordions (Primary open, "Lv N" meta); verify with tests that Galatian shows "Duty Eternal" and "Macro Plasma Incinerator" in the missing-text state with no stepper or chart, and that a stubbed text entry turns on the stepper and chart.
- [x] 4.4 Add `mow-upgrades-tab.tsx`: range fieldsets (From/To selects, To options start at From), Include owned materials switch (the character calculator's labelled switch, after review on #205; hidden signed out or unsynced, default on), Total needed, Upgrade materials (covered materials marked), Per level table with row-group headers; verify with component tests for the worked example totals, To clamping, toggle on/off and hidden signed out.
- [x] 4.5 Delete `LibraryCollectionPage` and its test, and remove unused `collections.detailUnavailable` strings; verify `pnpm typecheck` and `pnpm lint` report no dangling references.

## 4b. Mythic panel (no data yet)

- [x] 4b.1 Add optional `mythicAbility: { name }` to `mowSchema`, a `mythicLevel(progression)` helper (blue stars → 1–4, `undefined` below Mythic), and an optional `levelControl` on `AbilityPanel` that replaces the stepper; verify with unit tests for every Mythic step and Legendary, and with the existing ability-panel tests passing.
- [x] 4b.2 Show the Mythic panel on Details (desktop grid, mobile collapsed section with "Lv N" / "Unlocks at Mythic"), titled "Mythic ability" with the missing-text note, or the catalog ability's name and text when present; verify with page tests for Mythic 2 blue stars (level 2), Legendary (Unlocks at Mythic), Custom → Mythic Wings (level 4), a catalog `mythicAbility` (its name), and mobile.
- [x] 4b.3 Add the new strings (Mythic kind, "Mythic ability", "Unlocks at Mythic", level-from-stars line) in en/de/es/fr; verify with the locale parity test.

## 5. Tours

- [x] 5.1 Add `mows-list.tutorial.tsx` and `mow-unit.tutorial.tsx` (desktop and mobile steps per design D7, absent targets dropped) registered with `useTourPageSteps`, with `mowsList.tour.steps.*` and `mowUnit.tour.steps.*` keys in en/de/es/fr (the characters list's key pattern); verify with tutorial tests for both forms and for Galatian (no rules text).

## 6. Localization

- [x] 6.1 Add every new `library` string (list, header lines, tabs, panel kinds, calculator labels, toggle and its two hint lines, covered marker, table headings) in en, de, es and fr with real translations; verify with the locale key-parity test and by checking no English text remains in de/es/fr for the new keys.

## 7. Gates

- [x] 7.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check` and `openspec validate add-mow-library-details --strict`; all pass.

## 8. Desktop verification (≥ 768px, local Aspire stack)

Data states needed: a signed-in, synced account owning at least one MoW and missing at least one; inventory
with some ability badges and components; a signed-out session for the last task.

- [x] 8.1 MoW list: tiles in alliance/faction/name order, search, no-match, a tile opens the unit page and back returns to the list.
- [x] 8.7 Mythic panel live: an owned Mythic MoW (Biovore, Mythic Wings) shows level 4 and the missing-text note; a Legendary one shows "Unlocks at Mythic"; Custom changes the level. Verified 2026-10-14: Biovore "Level 4 · from blue stars" + note; Galatian (Legendary) "Unlocks at Mythic", Custom → Mythic Two Blue Stars gives "Level 2 · from blue stars".
- [x] 8.2 Owned MoW: "Your Machine of War" line, no rank badge, panels show "Yours: level N" and the missing-text note, Custom shows only rarity and stars; prev/next and position text keep the tab.
- [x] 8.3 Not owned MoW: grey portrait, Common, shard progress, Starting segment. **Accepted on page tests (user, 2026-10-14)**: the signed-in account owns all 11 MoWs, so no not-owned MoW exists; covered by the page test "starts an unowned MoW at Common with shard progress".
- [x] 8.4 Ability upgrades: owned defaults, To clamping, totals and per-level table for Galatian 1→3 / 1→2 equal the spec example, Include owned on/off changes badges, components and materials but not gold or salvage; numbers equal V1's MoW Lookup for one MoW and range. Verified 2026-10-14: Galatian owned defaults 39→49 / 21→31, To raised with From (55→55), toggle changes badges/components/materials but not gold (275,400), and 1→3 / 1→2 shows Gold 60, Salvage 15, 3 components, 3 Common Imperial badges. V1 is not runnable locally, so V1 parity rests on the 9-case fixture test (task 1.3) built from V1's own algorithm and data.
- [x] 8.5 `?tab=upgrades` deep link and reload; tours on the list and the unit page run without missing targets; light and dark themes.
- [x] 8.6 Signed out: banner with Sign in, no Include owned materials toggle, From starts at 1. **Accepted on page tests (user, 2026-10-14)**, not verified live: it needs the browser's session signed out; covered by the page tests ("shows the sign-in banner signed out", "hides Include owned materials signed out").

## 9. Mobile verification (< 768px via a same-origin iframe)

- [x] 9.1 MoW list at 360–420px: tile grid, search, nothing scrolls horizontally.
- [x] 9.2 Unit page: compact nav bar, header, sticky tab bar, Primary expanded and Secondary collapsed with "Lv N".
- [x] 9.3 Ability upgrades: fieldsets stacked, totals in two columns, only the per-level table scrolls horizontally.
- [x] 9.5 Mobile Mythic section: collapsed, header shows "Lv N" or "Unlocks at Mythic". Verified 2026-10-14 at 400px: Galatian's Mythic section is closed with "Unlocks at Mythic".
- [x] 9.4 Mobile tours on the list and the unit page target the accordion headers and calculator ids.

## Deferred / out-of-session

- Mythic ability data (name and rules text per MoW): not in the catalog, tracked in #204. The panel is built (group 4b) and shows it once the API adds `mythicAbility`.
- Archive after `add-character-unit-details` is archived (design D9), then delete the empty `library-detail-placeholder` capability.
