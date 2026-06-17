# design-sync notes — @workspace/ui → "Tacticus UI Kit"

Project: https://claude.ai/design/p/59d6604b-dc03-469e-90e9-f2e6ab10e10b
Shape: `package` (shadcn-style, React 19 + Radix + Tailwind v4). No Storybook.

## Build setup (why it's non-standard)

This package has **no barrel entry** (`exports` only exposes `./components/*`,
`./lib/*`, `./hooks/*`) and ships **Tailwind v4 source**, not compiled CSS. So a
pre-build step synthesizes what the converter needs:

- **`.design-sync/prebuild.mjs`** (run from repo root, after the package build):
  - writes `packages/ui/dist/index.es.js` (value barrel = `cfg.entry`) and
    `packages/ui/index.d.ts` (type barrel at the package root — the converter's
    `.d.ts` entry resolves to `<pkgDir>/index.d.ts`, so it MUST live there, not in dist/).
  - compiles `packages/ui/src/styles/globals.css` → `packages/ui/dist/_ds_styles.css`
    (`cfg.cssEntry`) via the Tailwind CLI in `.ds-sync/node_modules`.
  - copies the referenced `@fontsource-variable` woff2 into `packages/ui/dist/files/`
    so the compiled CSS's `url(./files/*.woff2)` refs resolve (Tailwind does NOT
    rebase them). Without this you get `[FONT_MISSING]` for Inter/DM Sans/Raleway.
- **`@workspace/ui/lib/utils` self-import**: resolved via `cfg.tsconfig`
  (`.design-sync/tsconfig.bundle.json`, `paths: @workspace/ui/* → packages/ui/dist/*`).
  The package's own `@workspace/ui` symlink only exists under `apps/web/node_modules`,
  so esbuild can't find it when bundling from `packages/ui/dist` — the tsconfig paths
  plugin is what makes it resolve. Do not remove cfg.tsconfig.
- `index.d.ts` (pkg root) and `dist/` are gitignored (build artifacts).

## Component scoping

- 117 PascalCase exports across 30 files; **29 primaries are synced as cards**.
  The 88 compound sub-parts (CardHeader, SelectItem, TooltipProvider, …) are
  excluded as standalone cards via `cfg.componentSrcMap: {<name>: null}` but remain
  **fully importable** on `window.TacticusUi` — each primary's authored preview
  composes its sub-parts. This is deliberate (sub-parts render empty/meaningless alone).
- If a NEW primary component is added: `prebuild.mjs` regenerates the barrels
  automatically, so it appears in the next sync; author `.design-sync/previews/<Name>.tsx`
  for it. If a new file adds new sub-parts, add them to `componentSrcMap` as `null`.
- **Grouping**: components are assigned to groups (Forms/Overlays/Display/Feedback/Layout)
  via category-frontmatter stubs in `.design-sync/docs/<Name>.md` + `cfg.docsDir`. These
  stubs are frontmatter-only, so the rich synthesized `.prompt.md` is preserved (an empty
  doc body falls back to synthesis). A NEW component needs a stub added here, else it lands
  in `misc`. Edit a component's stub to move it between groups.

## Verification status (IMPORTANT)

- **Playwright/Chromium was NOT installed** (user declined). The automated render
  check and per-story screenshot capture/grading were **skipped** — every build ran
  `package-validate.mjs --no-render-check`, and there are no `.grade.json` files.
- Verification was **visual, by the user**, via `.review.html` (served with
  `node .ds-sync/storybook/http-serve.mjs ./ds-bundle`). User signed off "looks good".
- To get automated verification on a future sync: install playwright + a matching
  chromium, then run `package-validate.mjs` (no `--no-render-check`) and
  `package-capture.mjs` for grades.

## Known render warns (triaged)

- `[RENDER_SKIPPED]` — expected and intentional (no playwright). Not a new warn.
- `tokens: 1 missing, below threshold` — non-blocking, accepted.

## Overlay/wide overrides (cfg.overrides)

Dialog/DropdownMenu/Popover/Select/Tooltip/Command render in their **open** state
via `cardMode: single` + a fixed viewport (Radix portals the open content). Table is
`cardMode: column`. If an overlay card looks clipped after an upstream change, adjust
its viewport.

## Re-sync risks (watch-list for the next run)

- **Barrels & CSS are regenerated, not committed** — always run `prebuild.mjs`
  before the converter, or you'll sync a stale/empty bundle. On a fresh clone also:
  `pnpm install`, `pnpm -F @workspace/ui build`, then re-install `.ds-sync` deps
  (`cd .ds-sync && npm i esbuild ts-morph @types/react @tailwindcss/cli@<tailwind ver>`).
- **Tailwind CLI version** is pinned to the repo's `tailwindcss` (4.3.0) in
  `.ds-sync` deps. If the package bumps Tailwind, bump the `@tailwindcss/cli` install
  to match or the compiled CSS may drift.
- **Fonts** depend on `@fontsource-variable/{inter,dm-sans,raleway}` staying installed
  with their `files/` woff2. If globals.css adds/removes a font subset, the copied set
  changes automatically (prebuild reads the compiled CSS).
- **Previews compose real sub-parts** — if an upstream refactor renames a sub-part
  (e.g. CardHeader), the affected preview .tsx must follow.
- Bundle is built from `dist/` — if `dist/` is stale, the synced components lag source.
  When in doubt, rebuild the package.
