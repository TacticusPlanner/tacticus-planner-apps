## 1. Prerequisite

- [ ] 1.1 Confirm the companion `tacticus-planner-api` `add-raid-boss-portraits`
      change has landed and the served `raid-bosses` payload carries `questUnitId`
      (check a synced record in the browser devtools / IndexedDB). If not, block
      this change on it.

## 2. Portrait data + helpers (game-catalog package)

- [ ] 2.1 Add `packages/game-catalog/src/game-entities/raid-boss-portrait-overrides.ts`
      porting V1 `guild-boss-portraits.ts`: `raidBossRoundPortraitOverrides`
      (`unitRoundIconMap`), `raidBossFullPortraitOverrides` (`bossPortraitMap`),
      `fieldNpcPortraitOverrides` (`npcUnitRoundIconMap`), and the
      `GuildBoss{N}`-prefix derived map. Include a documented comment block listing
      ids with no asset even in V1. Verify `pnpm typecheck`.
- [ ] 2.2 Add `packages/game-catalog/src/game-entities/icons/raid-boss.ts`:
      `raidBossPortrait(unitSetId)` (override → playable-character `characterIcon`
      → undefined) and `fieldNpcIcon({ id, questUnitId })` (npc override →
      `questUnitId` icon path → `questUnitId` override → undefined), returning
      `ASSET_BASE_PATH`-rooted URLs. Verify with unit tests covering a mapped boss,
      a playable prime, a `questUnitId`-resolved npc, and an unmapped id → undefined.
- [ ] 2.3 Export the helpers from the package barrel; verify an import from the
      web app resolves under `pnpm typecheck`.

## 3. Assets

- [ ] 3.1 Copy every `snowprint_assets/characters/*.png` referenced by the
      ported maps from the V1 repo (`../tacticusplanner/src/assets/images/`) into
      `apps/web/public/game_catalog/characters/`, keeping filenames. Verify each
      referenced file resolves (a small script asserting every override value maps
      to an existing file); add any genuinely missing file to the no-asset list in
      2.1 instead of leaving a dangling path.

## 4. Query surface

- [ ] 4.1 Add `questUnitId?: string` to the game-catalog raid-boss record type
      and its mapper (`packages/game-catalog`), populated from the served payload.
      Verify the query-surface test asserts it round-trips and is absent when the
      payload omits it.

## 5. UI wiring

- [ ] 5.1 In `entities/raid-boss/ui/raid-boss-portrait.tsx`, resolve `src` via
      `raidBossPortrait(unitSetId)` when a `unitSetId` prop is given; drop the
      "assets not yet bundled" comment. Keep the badge as the only fallback. Update
      the list (`raid-boss-list.tsx`) and detail to pass `unitSetId`.
- [ ] 5.2 In `raid-boss-detail.tsx`, render an icon (via `fieldNpcIcon`) beside
      each field-enemy name and each prime in the Prime Modifiers panel; badge/plain
      name when unresolved. Verify against the page test fixture.
- [ ] 5.3 Update `raid-bosses-page.tsx` to pass each field npc's `questUnitId`
      (from its unit-set record) into the icon resolver.

## 6. Verification + gates

- [ ] 6.1 Manual browser check on `/library/raid-bosses` (list + several boss
      details) at ≥768px and <768px: portraits render for bosses, primes, and field
      enemies; spot-check one boss per faction against V1 `learn/guildBosses`;
      confirm the badge only appears for the documented no-asset ids. Start the
      Aspire stack if needed.
- [ ] 6.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`,
      `git diff --check`; all green.

## 7. Deferred / out-of-session

- [ ] 7.1 Wire the full (non-round) boss splash art (`raidBossFullPortraitOverrides`)
      into the detail header — map is ported in this change, wiring tracked in
      `tacticus-planner-apps#122`.
