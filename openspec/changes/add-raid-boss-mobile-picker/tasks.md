## 1. Roster grouping helper

- [ ] 1.1 Add `buildRaidBossRosterGroups(payload)` → `{ boss, primes }[]` in served boss order to `apps/web/src/fsd/entities/raid-boss/lib/` (mirrors `encounters.ts` set-walking); export via the entity barrel. Verify a unit test asserts Tervigon Leviathan's group is `[Tervigon Leviathan, Warrior Leviathan]` and that every `payload.primes` id appears in exactly one group for a real fixture.
- [ ] 1.2 In `hooks/use-raid-bosses-catalog.ts`, build `rosterGroups: { boss: RaidBossListItem; primes: RaidBossListItem[] }[]` from the helper with portraits attached; add it to the hook's return type and `EMPTY`. Verify `pnpm --filter web typecheck` passes.
- [ ] 1.3 Thread `rosterGroups` through `raid-bosses-page.tsx` and `raid-bosses-page.view-model.ts` (`RaidBossesPageViewProps`). Desktop sub-page ignores it. Verify typecheck.

## 2. Mobile picker component

- [ ] 2.1 Add `mobile/raid-boss-mobile-picker.tsx`: Popover + cmdk `Command` (`shouldFilter={false}`, stable case-insensitive substring filter, Sheet-portal handling as in `unit-combobox.tsx`), `CommandGroup` per boss group, `CommandItem` per member using `RaidBossPortrait` for the avatar, `data-testid="raid-boss-mobile-picker"` on the trigger. Props: `rosterGroups`, `selectedId`, `onSelect`. Verify a component test: renders group headings, selecting an item calls `onSelect(unitSetId)`, typing a boss name keeps its whole group, typing a prime name narrows to matching members.
- [ ] 2.2 Add i18n keys `raidBosses.pickerPlaceholder` and `raidBosses.pickerEmpty` to `en/library.json` + de/es/fr. Verify `pnpm --filter web test:run library-translations` passes.
- [ ] 2.3 In `mobile/raid-bosses-mobile-page.tsx`, render `RaidBossMobilePicker` instead of `RaidBossList`. Leave `raid-boss-list.tsx` and the desktop page as-is. Verify the mobile page test still selects an entity and shows its detail.

## 3. Mobile tour step

- [ ] 3.1 In `raid-bosses.tutorial.tsx`, add a `mobilePicker` shared step targeting `[data-testid="raid-boss-mobile-picker"]` with new `tour.raidBosses.steps.mobilePicker.title/content` keys; use it in place of `bosses` + `primes` in the `mobile` step array only (desktop unchanged).
- [ ] 3.2 Add the `tour.raidBosses.steps.mobilePicker.*` copy to `en/library.json` + de/es/fr. Update `raid-bosses.tutorial.test.tsx` so the mobile expectation is the single picker target and desktop still expects the two section targets. Verify `pnpm --filter web test:run raid-bosses.tutorial` passes.

## 4. Gates and verification

- [ ] 4.1 Run `pnpm --filter web typecheck`, `pnpm --filter web lint`, `pnpm --filter web lint:fsd`, `pnpm --filter web test:run`, `git diff --check`. All green (pre-existing `dailies-layout` parallel-load flake aside).
- [ ] 4.2 Live check on the full Aspire stack at a <768px viewport on `/library/raid-bosses/GuildBoss1Boss1TyranTervigonLeviathan`: the roster is a searchable Select grouped per boss (heading + boss + its primes), search filters by name, selecting navigates to the detail; the mobile tour's roster step points at the picker. Confirm the desktop layout at ≥768px is unchanged (two-section grid).
