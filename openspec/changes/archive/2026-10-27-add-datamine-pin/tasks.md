# Tasks

## 1. Pin and fetch

- [x] 1.1 Add `apps/web/datamine/files.txt` (comment header, `raw/VERSION`) and `apps/web/scripts/datamine.mjs` with `pull <tag|sha>`, `pull --local [dir]`, `sync` and `ensureDatamine()`; verify `pnpm --filter web datamine:pull v1.43.157.2989` writes `v1.43.157.2989 b69413043ce26a645c94713604197a30aed78cf5` and the cache holds `raw/VERSION` = `1.43.157.2989`.
- [x] 1.2 Verify a folder entry: add `sprites-webp/fonts/`, run `datamine:sync`, and see 294 files fetched in the cache; then restore the list.
- [x] 1.3 Verify local mode: `datamine:pull --local` against a data-mines checkout writes `local` and copies the listed files; changing the list then makes `datamine:sync` fail with the re-copy command; re-pinning to the tag restores the committed REF.
- [x] 1.4 Add the `datamine:pull` / `datamine:sync` scripts to `apps/web/package.json`.

## 2. CI and docs

- [x] 2.1 Add the "Check the datamine is pinned to a commit" step to `.github/workflows/_build-web.yml` next to the API spec pin check.
- [x] 2.2 Document the workflow in `AGENTS.md`.
- [x] 2.3 Run eslint on the new script, `knip`, `pnpm --filter web typecheck` and `git diff --check`. No `src/` file changes, so the Vitest suite is unaffected.
