# Tasks

## 1. Generators

- [x] 1.1 Add the datamine paths both generators read to `apps/web/datamine/files.txt` and sync the cache.
- [x] 1.2 Move `generate-ability-text-i18n.mjs` to `ensureDatamine()`: referenced ids from `lineup.json`, `npc.json` and relic items; tables from `abilities.json`; descriptions from the language files. Check `.webp` relic icons.
- [x] 1.3 Move `generate-raid-boss-i18n.mjs` to `ensureDatamine()` and write the ability/trait namespaces in all four locales.
- [x] 1.4 Run both generators twice and confirm the second run changes nothing; confirm the ability generator still covers 434 ids with the 4 known gaps and exits 0.

## 2. Tests and docs

- [x] 2.1 Update the raid-boss rules-text test to expect the four locales with identical id sets.
- [x] 2.2 Update the comments that called the raid-boss namespaces English-only.
- [x] 2.3 Run the i18n, ability-text and raid-boss tests, eslint on the scripts, typecheck and `knip`.
