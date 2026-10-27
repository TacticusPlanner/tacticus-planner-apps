# Proposal

## Why

The apps' game text (`public/locales/*`: ability rules text, raid-boss text, upgrade/unit/trait names) and catalog images (`public/game_catalog/**`) are generated from, or copied out of, the V1 `tacticusplanner` checkout. That checkout is a hand-maintained copy of the game, and V2 is replacing it. The game's own data now lives in `TacticusPlanner/tacticus-planner-data-mines`: `raw/languages/{en,de,fr,es}.json` for text and `sprites-webp/` for images (WebP q82 copies of the game's sprites). That repo is private and holds about 700 MB of images, so the apps can't depend on a sibling checkout or commit the raw files.

This is step D0 of datamine roadmap steps 8 and 10 (`tacticus-planner-data-mines` `docs/roadmap.md`). It only adds the pin and the fetch. The generators move over in later changes: T1 (rules and raid-boss text), T2 (name namespaces), S1 and S2 (images into `public/game_catalog/datamines/` and `curated/`).

## What Changes

- `apps/web/datamine/REF` pins one data-mines commit as `<release tag> <full SHA>`, the same format as the API's `Data/datamine/REF`. It starts at `v1.43.157.2989 b69413043ce26a645c94713604197a30aed78cf5`, the release that added `sprites-webp/`.
- `apps/web/datamine/files.txt` lists the data-mines paths the generators may read. It starts with `raw/VERSION`; each later change adds what its generator reads.
- `apps/web/scripts/datamine.mjs` (`pnpm datamine:pull`, `pnpm datamine:sync`) fetches the listed paths at the pinned commit into `apps/web/node_modules/.cache/datamine`. It uses a sparse, depth-1, blob-filtered git fetch with the caller's own credentials. `--local [dir]` copies from a data-mines checkout instead and sets the pin to `local`. `ensureDatamine()` gives generators the cache, re-fetching when the pin or the list changed.
- CI rejects a `local` pin, mirroring the `openapi/api.ref` check.
- AGENTS.md documents the workflow.
- No generated file changes, and no runtime change.

## Capabilities

### New Capabilities

- `datamine-source`: generated game text and images come from one pinned data-mines commit, fetched into a cache and never committed raw.

### Modified Capabilities

- none

## Impact

- New: `apps/web/datamine/REF`, `apps/web/datamine/files.txt`, `apps/web/scripts/datamine.mjs`.
- `apps/web/package.json` (two scripts), `.github/workflows/_build-web.yml` (pin check), `AGENTS.md`.
- No companion `tacticus-planner-api` change. The API pins data-mines separately for catalog data; both pins should name the same release, and roadmap step 9 automates bumping both.
