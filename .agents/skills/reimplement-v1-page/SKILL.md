---
name: reimplement-v1-page
description: Repeatable process for re-implementing a V1 (tacticusplanner) page in the V2 rewrite (apps/web) — preserve the behavior/calculations but redesign the UI/UX, wire dedicated game-data i18n namespaces and id-based icon mapping, set the correct auth boundary, and add tests. Use for any V1 page migration (MoW/NPC/Upgrades/Equipment/Campaign lookups, planner pages, etc.).
---

# Re-implement a V1 page in the rewrite

The rewrite (`tacticus-planner-apps/apps/web`) keeps the _functionality_ of V1 (`v1/tacticusplanner`) but
replaces its stack (MUI + Ag Grid + redux store) with the V2 stack: **Feature-Sliced Design**, React Router
v8 (`app/routes.tsx`), the **`@workspace/ui`** shadcn components, **i18next**, and the
**`@workspace/game-catalog`** client (the static game data, no user state needed for reference pages).
**Do not copy the V1 UI** — preserve behavior, redesign the experience.

## When to use

When implementing any page that exists in V1 and should exist in the rewrite — especially reference/lookup
pages that must preserve existing calculations but improve design, accessibility, and maintainability.

## Inputs to inspect (before writing code)

- **Rewrite planning notes**: `tacticus-planner-docs/research/current-app-analysis/pages/<page>.md` (a short
  summary + "Evidence" pointing at the exact V1 files).
- **Rewrite conventions**: `apps/web/src/fsd/**` (FSD layers app→pages→widgets→features→entities→shared),
  `app/routes.tsx` (routing + auth guards), `shared/config/i18n` (i18next), `@workspace/ui` components, the
  `@workspace/game-catalog` package for the served dataset shapes/schemas, and `shared/game-catalog`
  (`useDatasetRecords(key)`, `GameCatalogProvider`) for the React data-fetching layer — game-catalog
  itself is pure TS with no React/JSX.
- **V1 implementation**: the page component + its `*.service.ts` (the real calculation), and the V1 models
  (`v1/.../src/fsd/4-entities/*`, `5-shared/model/*` — e.g. enums like `Rank`).
- **Assets**: rewrite `apps/web/public/snowprint_assets/**` (characters, upgrade_materials, stat_icons, …),
  V1 `public/`, and especially **V1 `src/assets/images/**`** (ranks, campaigns, factions, … often missing
  from the rewrite). Note that V1 sometimes names an asset differently (e.g. Adamantine ranks are
  `ui_icon_rank_mythical_0{n}.png`).
- **i18n + routing + tests** that already exist, to match conventions.

## Migration process

1. **Purpose & workflows** — read the planning notes + V1 page; state what the user is trying to do.
2. **Extract behavior** — read the V1 `*.service.ts`; capture the calculations, data dependencies, and edge
   cases (invalid ranges, missing data, special toggles). Note which inputs are **user state** vs **static
   catalog data**.
3. **Separate behavior from UI** — list what must be preserved vs the V1 UI choices that should be redesigned.
4. **Auth boundary** — if the page needs no user data, make it **public**: add it as a child of the shared
   `AppShell` layout route in `app/routes.tsx` (the shell wraps `GameCatalogProvider`). Only gate behind
   `ProtectedRoute` if it reads user state. The shell handles both anonymous and signed-in users.
5. **Design desktop & mobile separately** — wider/denser tables, sliders, side-by-side panels on desktop;
   step-flow with selects/steppers, cards, and accordions on mobile. Implement with the **orchestrator +
   sub-page pattern**:
   - `pages/<page>/ui/<page>-page.tsx` — business logic only (data hooks, calc, derived state); renders
     `isMobile ? <PageMobilePage {...props}/> : <PageDesktopPage {...props}/>`
   - `pages/<page>/ui/desktop/<page>-desktop-page.tsx` — desktop layout (sticky sidebar controls, tables, etc.)
   - `pages/<page>/ui/mobile/<page>-mobile-page.tsx` — mobile layout (stacked, accordions, cards)
     Each sub-page receives a flat props interface with computed data and callbacks — no `isMobile` prop.
6. **Map game entities to i18n namespaces** — dedicated namespaces keyed by **entity id**: `characters:<id>`,
   `ranks:<id>`, `upgrades:<id>`, `campaignLocations:<id>`, … Generate the `en` JSON from the catalog source;
   other languages can be empty `{}` files that fall back to `en`. Resolve with
   `t('ns:'+id, { defaultValue: catalogName })`. Load namespaces lazily via `useTranslation([...])`.
7. **Map icons/assets by entity id** — all icon-helper functions live in **`@workspace/game-catalog`**
   (`packages/game-catalog/src/game-entities/icons.ts`). Import them directly from `@workspace/game-catalog`
   in consuming code (pages, features, shared). Do **not** create entity slices that are pure re-exports — if
   an entity slice has no app-specific logic, delete it and point consumers at the package. Rules:
   - Upgrade icons: `upgradeIcon(id)` → derives path directly from id; always valid.
   - Rank icons: `rankIcon(id)` → `id.toLowerCase() + ".png"` — rename V1 Mythical assets to `Adamantine*.png`.
   - Character icons: `characterIcon(id)` → derives `camelCase→snake_case` slug; ~30 characters diverge and
     need an overrides map (`character-icon-overrides.ts`); commit the overrides once.
   - Campaign icons: `campaignIcon(groupId, difficulty)` → standard and event campaigns both covered; event
     images show the defending faction (Y in X-vs-Y groupId).
   - Use `<EntityIcon src fallback>` (`shared/ui/entity-icon.tsx`) to handle missing assets gracefully.
8. **Identify gaps** — copy missing assets from V1 `src/assets/images/**` into `public/snowprint_assets/**`;
   document anything genuinely missing and choose the cleanest fallback (text badge, generic icon).
9. **Implement with FSD + reuse** — pure calc in `features/<page>/lib` (decoupled from catalog types via
   structural shapes); entity helpers in `entities/*`; the page in `pages/<page>`; compose in `app/routes.tsx`.
   Prefer reusable components for things future lookup pages share (entity icon, rank badge, combobox).
10. **Tests** — unit-test the calc (ranges/edge cases/aggregation); test id→icon mapping + fallbacks; test
    the page renders unauthenticated with mocked `useDatasetRecords`; update the landing test for the new link.
    Add jsdom polyfills (ResizeObserver/matchMedia/pointer capture) to `src/test/setup.ts` for Radix.
11. **Document intentional differences** — note what you dropped (e.g. user-progress-dependent estimates on a
    public page) and what you redesigned, in the page and in the PR.

## Output checklist

- [ ] Route added in the correct app area (`app/routes.tsx`), scalable for siblings
- [ ] Authentication boundary confirmed (public vs `ProtectedRoute`)
- [ ] V1 functionality preserved (calculations + edge cases ported and unit-tested)
- [ ] V1 UI **not** blindly copied
- [ ] Desktop UX reviewed (dense/efficient)
- [ ] Mobile UX reviewed (step-flow, cards/accordions, touch targets)
- [ ] Localization added via dedicated id-keyed namespaces (generated + lazily loaded)
- [ ] Icons mapped consistently by entity id, with fallbacks
- [ ] Missing asset gaps checked across V1 `public/` and `src/assets/`, copied or documented
- [ ] No signed-in user-data dependency for public pages
- [ ] Tests added/updated (calc, mapping, route accessibility, landing link)
- [ ] Light/dark verified
- [ ] Future reuse opportunities identified (shared entity/feature components)
- [ ] Intentional differences from V1 documented

## Worked example — Rank Lookup (`/lookup/ranks`)

- **Behavior** (from `v1/.../1-pages/learn-characters/rank-lookup.service.ts`): pick a character + rank range
  (+ "point five"), flatten `rankUpUpgrades` over the range, aggregate uncraftable **base materials**, and
  show campaign **farm locations**. The catalog (`characters[].rankUpUpgrades`, `upgrades[].recipe`/
  `farmLocations`, `campaign-battles`) supplies all of it → **public, no user data**. V1's user
  `campaignsProgress` (unlocked-location highlighting / farm-time estimates) is intentionally **dropped**.
- **Code**: calc in `features/rank-lookup/lib/rank-lookup-calc.ts`; game enums + icon helpers in
  `@workspace/game-catalog` (`game-entities/`), imported directly (no entity re-export shims); page in `pages/rank-lookup`
  with orchestrator `rank-lookup-page.tsx` → `desktop/rank-lookup-desktop-page.tsx` (slider + table) and
  `mobile/rank-lookup-mobile-page.tsx` (selects + accordion/cards); wired via `AppShell` in `app/routes.tsx`.
- **i18n/assets**: `en/` locale files for `characters/upgrades/campaignLocations/ranks/factions` generated
  manually from catalog; other languages are empty `{}` (en fallback). Rank assets renamed to `{RankId}.png`
  (e.g. `adamantine1.png`). Character icons derived from camelCase id → snake_case with `character-icon-overrides.ts`
  for the 32 divergent slugs.
