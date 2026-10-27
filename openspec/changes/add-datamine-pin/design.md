# Design

## Decisions

### 1. The apps keep their own pin, same format as the API's

`apps/web/datamine/REF` holds `<tag> <sha>` (or a bare SHA when pinned by SHA). The SHA is authoritative because the data-mines release workflow moves a tag when a version is re-extracted (`force: true`). Reusing the API's format lets step 9's automation write both pins the same way. The pins are independent files so an apps-only bump (for example a sprite fix) does not need an API release.

### 2. Raw files are cached, not committed

Language files are about 2.5 MB per locale, and the sprites are hundreds of MB. Only generated output (namespace JSON, copied WebP) is committed, so a reviewer sees exactly what ships. The cache lives in `apps/web/node_modules/.cache/datamine`, which is already gitignored and is wiped with `node_modules`.

### 3. Sparse, shallow, blob-filtered git fetch

`git fetch --depth 1 --filter=blob:none` of the pinned SHA, with a non-cone sparse checkout of `files.txt`, downloads only the listed blobs. The script uses `git` rather than raw HTTPS because the repo is private and contributors already have git credentials for it. Fetching a folder entry such as `sprites-webp/fonts/` (294 files) takes about 2 s.

### 4. The allowlist is a contract with data-mines

`files.txt` names data-mines paths. data-mines' AGENTS.md treats `raw/` and `sprites-webp/` paths as a contract, so a rename there breaks the fetch loudly (a missing path fails `--local`, and the generators fail on a missing file) instead of silently.

### 5. Stale-cache detection

`.pinned` in the cache records the pin and the allowlist it was filled for. `ensureDatamine()` re-fetches when either differs. A `local` pin never auto-fetches: it fails with the command to re-copy.

## Risks

- CI can't fetch the private repo. That's fine: CI never runs the generators, it only checks committed output, as with `api.json`.
- The apps pin and the API pin can drift. Contributors are told to keep them on the same tag; step 9 bumps both together.
