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
  - compiles **`.design-sync/_ds_styles_entry.css`** → `packages/ui/dist/_ds_styles.css`
    (`cfg.cssEntry`) via the Tailwind CLI in `.ds-sync/node_modules`. The entry
    `@import`s the package's real `globals.css` AND adds `@source "./previews/**"`
    so utility classes used ONLY in `.design-sync/previews/*.tsx` (which are outside
    globals.css's own `@source` globs) get compiled. Without this, a preview using a
    class not present elsewhere in the app renders unstyled.
  - copies the referenced `@fontsource-variable` woff2 into `packages/ui/dist/files/`
    so the compiled CSS's `url(./files/*.woff2)` refs resolve (Tailwind does NOT
    rebase them). The font set is scanned **dynamically** from every installed
    `@fontsource-variable/*` package (currently **Noto Sans + Inter**; the kit
    previously shipped Inter/DM Sans/Raleway — do not hard-code the list).
- **`@workspace/ui/lib/utils` self-import**: resolved via `cfg.tsconfig`
  (`.design-sync/tsconfig.bundle.json`, `paths: @workspace/ui/* → packages/ui/dist/*`).
  The package's own `@workspace/ui` symlink only exists under `apps/web/node_modules`,
  so esbuild can't find it when bundling from `packages/ui/dist` — the tsconfig paths
  plugin is what makes it resolve. Do not remove cfg.tsconfig.
- `index.d.ts` (pkg root) and `dist/` are gitignored (build artifacts).

## Dark theme by default (preview cards)

- The DS cards render on the **dark** theme. `DsThemeRoot`
  (`.design-sync/ds-theme-root.tsx`, exposed via `cfg.extraEntries` and wired as
  `cfg.provider`) wraps every preview + floor card: it adds `.dark` to the card's
  `<html>` (shadcn flips tokens by redefining CSS vars under `.dark`, so an ancestor
  class suffices), paints the body with the dark `--background`/`--foreground`, and
  re-tints the converter's grid chrome (cell borders/labels). The CSS default is
  still light — this only affects how cards are rendered.

## Component scoping

- **33 primaries are synced as cards** across 34 source files; the ~128 compound
  sub-parts (CardHeader, SelectItem, DrawerContent, SidebarMenuButton, …) are
  excluded as standalone cards via `cfg.componentSrcMap: {<name>: null}` but remain
  **fully importable** on `window.TacticusUi` — each primary's authored preview
  composes its sub-parts. This is deliberate (sub-parts render empty/meaningless alone).
- **Sonner**: `cfg.extraEntries` includes `"sonner"` so `toast` is exposed on
  `window.TacticusUi` — the Toaster preview's `toast()` is then the SAME instance
  the kit's `<Toaster>` renders (a preview-bundled copy would be a separate store
  and its toasts would never show). The build warns `[EXPORT_COLLISION] sonner …
  Toaster` — EXPECTED and benign: the kit's styled `Toaster` wins over sonner's raw
  one (main package binding wins). Do NOT "fix" it with cfg.storyImports.bundle.
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
- `[EXPORT_COLLISION] sonner … Toaster` — expected (see Component scoping). Benign.
- `[DTS_STYLE_SYSTEM] filtering @types/react props` — the div-based parts (Sheet/
  Sidebar/Drawer extend `ComponentProps<"div">`) trip the CSS-shorthand filter.
  Non-blocking; override with `cfg.dtsPropsFor.<Name>` only if a real prop is lost.

## Overlay/wide overrides (cfg.overrides)

Dialog/DropdownMenu/Popover/Select/Tooltip/Command/**Drawer/Sheet** render in their
**open** state via `cardMode: single` + a fixed viewport (Radix/vaul portal the open
content). **Sidebar** is also `single` (inline `collapsible="none"`, needs room).
**Toaster** is `single` with toasts fired on mount. Table is `cardMode: column`. If
an overlay card looks clipped after an upstream change, adjust its viewport.

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
