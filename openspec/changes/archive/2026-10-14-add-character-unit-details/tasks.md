## 1. Data checks and domain rules

- [x] 1.1 Confirm data assumptions with a one-off script (not committed): every catalog character's `activeAbilityNames`/`passiveAbilityNames` id exists in `abilities` and, for most characters, fully resolves in `npcAbilityText`; catalog `health`/`damage`/`armour` equal V1 `new-character-data2.json` `initialStats` for the same ids; whether relic `equipment.abilityId`s exist in `npcAbilityText`. Record the results in design.md Risks; pause and surface if any assumption fails.
- [x] 1.2 Add `pierceRatio(damageType)` to `packages/game-domain` ported from V1 `pierce-ratio.ts`, with Chain and Plasma corrected to the Tacticus wiki's table (including the `HeavyRound` and `Gauss` aliases; unknown → `undefined`) with its V1 test cases; `pnpm --filter game-domain test` passes.
- [x] 1.3 Add `startingProgression(rarity)` to `packages/game-domain` (Common → `Common:None`, Uncommon → `Uncommon:TwoStars`, …, Mythic → `Mythic:OneBlueStar`) with tests for every rarity.
- [x] 1.4 Add the radar model `buildStatRadar` (design D5) in `pages/library/model/` with tests: Tigurius Health 8,679 → 6 of 119 lower → 5% (spec worked example); melee-only unit reads 0% on ranged axes; ties not counted; parity with V1 `buildRadarStats` percentiles for at least five characters using V1's data file as a fixture.
- [x] 1.5 Add `buildAbilitySeries(entry, rarity)` (design D4) in `shared/ability-text` with tests: `StormOfWrath` gives a `minDmg`–`maxDmg` band and a non-constant `maxAdjacentTargets` series, values scaled by the rarity factor and equal to what `resolveVariable` renders at the same level; a constant variable is flagged; only the first two non-constant series are charted.

## 2. Shared building blocks

- [x] 2.1 Move `useNpcAbilityText`/`useNpcTraitText` to `shared/ability-text` as `useAbilityText`/`useTraitText`, re-exported under the old names from `entities/npc`; NPC and raid boss tests still pass and `pnpm lint:fsd` is clean.
- [x] 2.2 Add tokens `--chart-grid` and `--hl` (light and dark) to `packages/ui/src/styles/globals.css` and `@theme`; measure `--chart-1` against `--card` in both themes (≥ 3:1) and note the ratios here. Measured: light 6.78:1, dark 4.91:1 — no retune needed.
- [x] 2.3 Build `shared/ui/level-chart` (design D6): line and band series, 3 y ticks with compact format, labelled x ticks, marker, hover readout in the header, column click callback, `<figure>` + hidden `<figcaption>` from `describeSeries()`, optional non-zero y start (relic). Tests cover band rendering, marker position, click → callback level, and the caption text.
- [x] 2.4 Build the unit page shell in `pages/library/ui/unit/`: navigation bar (back by origin, breadcrumb, prev/next with `aria-label`s and disabled ends, position text, tour button), `UnitPortrait` filler (design D8), tab bar (`role="tablist"`, roving focus, arrow keys) with `useUnitTab()` keeping other query params. Tests: prev/next order from origin state and from the default list order; tab switch keeps `rankStart`; unknown `tab` → Details.
- [x] 2.5 Build the ability panel in `pages/library/ui/unit/`: icon, kind, name, `NumberStepper` 1–60, `AbilityText` at the level with highlighted values, next-level line (hidden at 60, "· Yours: level n" when owned), level charts, the "stays at" line for constants, and the missing-text state. Tests: stepper, text, next line and marker move together; chart click sets level; missing text shows the note and no stepper/chart.

## 3. Characters list page

- [x] 3.1 Replace the `characters` route with a characters list page (tile grid on the NPC list pattern, alliance → faction → name, name search, no-match state with Clear, loading and load-failure states); tiles link to `/library/characters/{id}` with origin state; query params dropped. Page tests cover each spec scenario of "Characters list page".
- [x] 3.2 Update `useLibraryRouteSelection` usage so Characters no longer redirects (other collections unchanged); update `use-library-route-selection.test.tsx` and add a test that `/library/npcs` still redirects.

## 4. Character unit page

- [x] 4.1 Add the unit page route for `characters/:entityId` with loading, load-failure and not-found states; tests for an unknown id.
- [x] 4.2 Implement value states (design D3): roster check, owned / not owned / no roster header lines, shard progress bar for not owned, Sign in / Sync with Tacticus banner, values control (Your unit or Starting | Custom with Rarity, Stars, Rank selects using `ProgressionSelect`/`RankSelect`), reset on unit change. Tests for the three states (spec scenarios incl. Tigurius at Mythic, 2 blue stars, Adamantine II → Health 8,032) and Custom not affecting radar or calculator.
- [x] 4.3 Details tab, desktop: At a glance (with Health/Armour percentiles), Traits (name only when text missing), Active and Passive panels, Compared with other characters (radar SVG with median outline + percentile list, `aria-hidden` plot and caption), Stats by rank (three `LevelChart`s with "(yours)" readout), Relic panel (relic from `equipment.isRelic` + `allowedUnits`, level from the equipped relic, missing-text state when no text; "<name> has no relic." card (mobile summary "None") for a character without one; "Unique relic" / "Shared relic" label with the other characters listed for a shared one; At a glance marks the relic's slot and each slot expands into its equippable items by rarity, unnamed "_" items hidden). Component tests per section, including Lhykhis (no ability text) and a character with no relic.
- [x] 4.4 Rank-up materials tab: host the existing calculator for the route's character, remove the unit picker from desktop and mobile controls, keep URL params, Apply, Share (URL includes `tab=rankup`) and range defaults. Adapt `character-lookup-page.test.tsx`, `character-lookup-controls.test.tsx`, `character-lookup-mobile-page.test.tsx`; delete picker-only tests; `use-lookup-selection.test.tsx` unchanged and passing.
- [x] 4.5 Mobile form (design D7): compact nav bar with 44px icon buttons, header with values control on its own row, sticky full-width tab bar, At a glance first then accordions (Traits, Active, Passive, Compared, Stats by rank as a table, Relic) with summary values, Active expanded. Tests render below 768px and assert the accordion structure and the stats table.

- [x] 4.6 Mythic quests (added during implementation, design D11): generate `mythicQuests` and `mythicQuestTasks` (en) from V1's data, register them in `i18next.d.ts`, add the reward parser and template variables with tests (every reward kind recognised, every task has a template), and the Mythic quests card (desktop card beside the relic, mobile section with a quest count) with page tests for a character with and without quests; copy in en/de/es/fr.

## 5. Tours

- [x] 5.1 Add `characters-list.tutorial.tsx` and `character-unit.tutorial.tsx` (desktop and mobile steps; unit tour covers header + values control, tabs, an ability panel, the radar, the Rank-up tab; absent targets left out) registered with `useTourPageSteps`; remove `character-lookup.tutorial.tsx`. Add the steps' copy under `library` `charactersList.tour.*` and `characterUnit.tour.*` (the NPC tour's namespace and pattern) with real en/de/es/fr translations, and remove the old `tour.lookup` keys from every locale. Tutorial tests for both forms and for Lhykhis (no relic/text steps).

## 6. Localization

- [x] 6.1 Add every new UI string (list, nav bar, header states, values control, tabs, section titles, chart titles/captions, missing-text note, percentile labels and footnotes) to the `library` namespace with real de/es/fr translations matching sibling namespaces; remove keys only used by the removed picker; i18n resource type tests pass.

## 7. Gates

- [x] 7.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`, and `openspec validate add-character-unit-details --strict` all pass.

## 8. Desktop verification (≥ 768px, local Aspire stack)

Data states needed: a signed-in synced account owning a character with a relic equipped (e.g. one at Mythic), a character it doesn't own, and a signed-out session.

- [x] 8.1 Characters list: tiles, search, no-match, a tile opens the unit page; back returns to the list.
- [x] 8.2 Owned character: header "Your unit…" values, steppers start at the player's levels, Custom changes At a glance and Stats by rank but not the radar or calculator, prev/next and position text.
- [x] 8.3 Not owned character (grey portrait, Starting values, shard progress) and signed out (banner, Sign in); Lhykhis shows the missing-text state. Verified 2026-10-13: not owned (Fabius Bile: grey portrait, Legendary · Red Three Stars · Stone I, 0 / 500 shards, Starting) and Lhykhis. Signed out not checked live (it would sign the session out); accepted on the page tests.
- [x] 8.4 Charts: hover readout, click sets level, band for min–max, constant line; radar Health/Armour percentiles match At a glance; light and dark themes.
- [x] 8.5 Rank-up materials: deep link with range, Apply, Share URL includes `tab=rankup`, switching tabs keeps the result, reload keeps the tab.
- [x] 8.6 Tours on the list and the unit page run without missing targets.

## 9. Mobile verification (< 768px via a same-origin iframe)

Same data states as section 8.

- [x] 9.1 Characters list at 420px: tiles and search usable, no horizontal scroll.
- [x] 9.2 Unit page: compact nav, header, sticky tab bar, accordions with Active expanded, Stats by rank table, no horizontal scroll at 360px.
- [x] 9.3 Rank-up materials tab uses the existing mobile calculator layout without the picker.
- [x] 9.4 Tours on both pages in the mobile form.
