## 1. Navigation and routes

- [x] 1.1 Remove the `/dailies/onslaught`, `/dailies/salvage-run`, and `/dailies/arena` children from the `/dailies` item in `app/layout/nav-items.ts` and drop their keys from the label-key union; verify the desktop section menu, mobile section tabs, and navigation search no longer list them.
- [x] 1.2 Remove the three routes and their lazy imports from `pages/dailies/route.tsx`; verify the page modules remain in the repo and `pnpm lint:fsd` passes.
- [x] 1.3 Remove `tabs.onslaught`, `tabs.onslaughtDescription`, `tabs.salvage-run`, `tabs.salvage-runDescription`, `tabs.arena`, and `tabs.arenaDescription` from `dailies.json` in de, en, es, and fr.

## 2. Regression

- [x] 2.1 Update `section-tabs.test.tsx` (Dailies deep-link cases) and `dailies-layout.test.tsx` (route cases for the three pages become unknown-route assertions); verify the Dailies tab count is three.
- [x] 2.2 Manually verify in the Aspire stack on desktop (≥768px) and mobile (<768px): Dailies shows Raids, Shops, Guild Raids only; `/dailies/onslaught` is an unknown route; `/progress/onslaught` still opens.
- [x] 2.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
