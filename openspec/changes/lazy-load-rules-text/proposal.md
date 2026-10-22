# Proposal

## Why

The unit, MoW, NPC and raid-boss pages read their ability rules text through `useTranslation("npcAbilityText")` / `useTranslation(["raidBossAbilityText", …])` at page level with Suspense on, so the whole page suspends to the layout's `LoadingFill` until a 598 KB (102 KB gzipped) or 229 KB (42 KB gzipped) JSON namespace has downloaded and parsed, even though one unit needs two to four entries of about 1 KB each. The NPC list route canonicalizes to a selected NPC, so `/library/npcs` pays the full download before first paint. Both files are also cache-busted by `?v=<appVersion>`, so every release re-downloads everything.

Evidence (audit 2026-10-20): `apps/web/src/fsd/shared/ability-text/use-ability-text.ts:30`, `entities/raid-boss/lib/use-raid-boss-text.ts:26`, page-level calls in `pages/library/ui/character-unit/character-unit-page.tsx:129`, `mow-unit/mow-unit-page.tsx:132`, `npcs/npc-abilities.tsx:36`, `npcs/npc-traits.tsx:24`, `raid-bosses/raid-boss-ability-panel.tsx:39,105`; nearest Suspense boundaries `app/layout/desktop-layout.tsx:153` and `mobile-layout.tsx:81`; sizes from `apps/web/public/locales/en/`. The HRE team recommender (`pages/dailies/model/use-hre-team-recommendations.ts:65-76`) scans every English description to find summoning abilities, so it is the one consumer that needs the whole table.

## What Changes

- **BREAKING (file layout):** the `npcAbilityText` and `raidBossAbilityText` namespaces are split into one file per ability id: `public/locales/{lng}/npcAbilityText/<abilityId>.json` (en, de, es, fr) and `public/locales/en/raidBossAbilityText/<abilityId>.json`. Each file keeps today's entry shape keyed by its ability id, so the content is unchanged and the generators only change where they write. The two monolithic files are deleted.
- Ability panels load only the namespaces of the abilities they show, without suspending the page: the page paints at once, each panel shows a loading state until its text arrives, and a failed download shows a failure note with a retry on that panel instead of the generic missing-text note.
- The trait namespaces `npcTraitText` (16 KB) and `raidBossTraitText` (12 KB) stay whole but load the same way, with the panel instead of the page.
- The ability-text generator additionally writes `public/locales/en/npcAbilitySummoners.json`, the list of ability ids whose English text summons a unit, so the HRE team recommender reads a 1 KB list instead of 434 descriptions. The HRE behavior (summon-free teams per `hre-mission-teams`) is unchanged.
- The committed-file test and the generators' reproducibility checks move from four files to the per-ability directories plus the summoners list.
- No change to catalog datasets, the API, the `?v=` cache-busting or cache headers (immutable caching of locales is `trim-startup-bundle`).

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `ability-rules-text`: the namespace is stored one file per ability; rules text loads per panel without blocking page paint, with loading and failure states; the summoning-ability list is a generated, reproducible artifact of the same namespace.
- `raid-boss-library`: the detail view's ability and trait rules text loads per panel after the view paints, with loading and failure states.

## Impact

- `apps/web/public/locales/{en,de,es,fr}/npcAbilityText/` (new, about 434 files per locale), `public/locales/en/raidBossAbilityText/` (152 files), `public/locales/en/npcAbilitySummoners.json`; the two monolithic files removed.
- `apps/web/scripts/generate-ability-text-i18n.mjs`, `scripts/generate-raid-boss-i18n.mjs`.
- `shared/ability-text/use-ability-text.ts`, `entities/raid-boss/lib/use-raid-boss-text.ts`, the five page call sites above, `pages/dailies/model/use-hre-team-recommendations.ts` and `hre-summoners.ts`, `shared/config/i18n/i18next.d.ts`.
- Tests: `shared/config/i18n/npc-ability-text-translations.test.ts`, `shared/ability-text/ability-series.test.ts`, `pages/library/ui/unit/ability-panel.test.tsx`, the character, MoW and raid-boss page tests, `pages/dailies/model/hre-summoners.test.ts`.
- New `library` namespace keys for the panel loading and failure copy, in all four locales.
- Siblings: `trim-startup-bundle` owns immutable caching and hashed locale paths; `catalog-read-layer` is unaffected (rules text stays in i18next, not in the catalog). No companion `tacticus-planner-api` change: the api store serves ids only and must not carry display strings.
