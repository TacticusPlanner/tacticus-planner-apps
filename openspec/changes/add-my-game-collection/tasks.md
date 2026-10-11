## 1. Navigation: per-child access

- [ ] 1.1 Add optional `anonymousAllowed` to `NavSubItemBase` (inheriting the section's value when absent) and move visibility filtering for sections and children into `use-nav-items.ts`, removing the section-only filter from `app-shell.tsx`; verify with `use-nav-items.test.tsx` cases for an anonymous user (mixed section keeps only anonymous children; a section left with zero children is dropped) and a signed-in user (all children)
- [ ] 1.2 Make desktop section-entry and last-visited-child resolution fall back to the default child when the remembered child is not visible; verify with a test where the remembered child is `/my-game/campaigns` and the user is anonymous → `/my-game/collection`
- [ ] 1.3 Confirm the desktop section menu, mobile tab row (`section-tabs.tsx`), mobile drawer and navigation search consume the filtered tree; verify with an anonymous-user test per consumer showing only Collection under My Game and no Onslaught search result

## 2. Navigation: My Game section and route move

- [ ] 2.1 Rename `pages/progress` to `pages/my-game` (`MyGameLayout`, index → `collection`, children `collection`, `campaigns`, `campaign-events`) and update `app/routes.tsx` to mount `/my-game` unwrapped, with `onslaught`, `campaigns` and `campaign-events` each wrapped in `ProtectedRoute`; verify with routing tests: anonymous on `/my-game/onslaught` hits sign-in handling, anonymous on `/my-game/collection` renders, and `/progress/*` hits not-found
- [ ] 2.2 Replace the Progress `NavItem` in `nav-items.ts` with My Game (`/my-game`, `anonymousAllowed: true`, `mobilePlacement: "menu"`), children Collection (anonymous), Onslaught, Campaigns, Campaign Events (each `anonymousAllowed: false`); verify with the desktop-layout and mobile-layout tests listing the four children in order for a signed-in user
- [ ] 2.3 Update the `/progress/onslaught` link in `pages/goals/ui/create-goal/acquisition-source-field.tsx` and any other `/progress` reference in source and tests; verify `rg "/progress" apps/web/src` returns no route references
- [ ] 2.4 Rename i18n keys `nav.progress*` → `nav.myGame*` and `progress.tabs.*` → `myGame.tabs.*` (plus `collection` / `collectionDescription`) in `common` for en/de/es/fr with real translations, and update typed resources and consumers; verify `pnpm typecheck` and that no locale still contains the old keys
- [ ] 2.5 Update `general.tutorial.tsx` and its `tour.*` copy in all four locales to refer to My Game instead of Progress on desktop and mobile; verify with the general tutorial tests

## 3. Unit tile entity

- [ ] 3.1 Create `entities/unit` with a public `UnitTile` (owned character, owned MoW, unowned character with unlock target, unowned MoW with count only, unknown-shards state), reusing `shared/ui` rank badge / rarity icon and the game-catalog icon helpers; verify with component tests per state asserting which indicators render and that power is never rendered
- [ ] 3.2 Give the tile its accessible name and a desktop-only tooltip (none on mobile) and make it non-interactive; verify with tests that clicking does nothing, `aria-label` equals the unit name, and the tooltip appears only at ≥768px
- [ ] 3.3 Run `pnpm lint:fsd` to confirm `entities/unit` imports nothing from features or pages

## 4. Collection view-model

- [ ] 4.1 Implement `buildCollectionView` in `pages/my-game/model/collection-view.ts` (roster state, faction grouping and ordering, owned/unowned ordering, progression → rarity/stars, `abilities[0|1]` mapping, unlock cost by initial rarity, summary derived from groups); verify with unit tests using real catalog ids: the spec's Titus, Calgar 75/400 and MoW scenarios, the 84-of-131 summary, alliance order, `mows` chunk unsynced → MoWs unowned, `inventory-shards` missing → no shard counts
- [ ] 4.2 Add a `useCollectionView` hook that reads the catalog, roster and shard inventory, re-reads after sync completes, and exposes loading / catalog-error / roster-error states; verify with hook tests for each state, including the roster appearing after a simulated sync without remount

## 5. Collection page

- [ ] 5.1 Build the Collection page (`pages/my-game/ui/collection/`): summary, faction group cards (icon + localized name), tile grid, multi-column desktop and single-column mobile; verify with page tests for owned and unowned rendering at both breakpoints
- [ ] 5.2 Add the no-roster prompts (anonymous → sign in; signed-in not synced → sync prompt with the existing Sync with Tacticus action), the loading state, catalog error with retry and roster error with retry; verify with page tests for each state
- [ ] 5.3 Add `myGame.collection.*` copy in en/de/es/fr with real translations; verify by checking that every key exists in all four locales
- [ ] 5.4 Add `collection.tutorial.tsx` with desktop and mobile steps (summary, first faction group, first owned tile, first unowned tile), registered via `useTourPageSteps`, plus `tour.collection.steps.*` copy in en/de/es/fr; verify with tutorial tests that every step target exists in each layout and the summary step is skipped without a roster

## 6. Desktop verification (viewport ≥768px)

Data states needed: an anonymous session, a signed-in account with a synced roster that has owned and unowned characters and MoWs, and (where feasible) a signed-in account before its first sync.

- [ ] 6.1 Signed in and synced: open My Game from the sidebar → lands on Collection; the section menu lists four children; faction cards show owned tiles with all indicators and greyed unowned tiles with shard progress; the tooltip shows the name; clicking does nothing
- [ ] 6.2 Anonymous: My Game shows only Collection; all units greyed; the sign-in prompt is shown; search for "onslaught" finds nothing under My Game; `/my-game/onslaught` triggers sign-in handling
- [ ] 6.3 Run the Collection page tour and the general tour; each step highlights a visible element

## 7. Mobile verification (viewport <768px, same-origin iframe per `tp-manual-ui-verification`)

- [ ] 7.1 Signed in and synced: the drawer lists My Game with four children; the header tab row shows four tabs; faction cards are single-column with smaller tiles and no tooltip
- [ ] 7.2 Anonymous: the drawer and tab row show only Collection; the greyed catalog and sign-in prompt render
- [ ] 7.3 Run the Collection page tour on mobile; each step highlights a visible element

## 8. Gates and spec housekeeping

- [ ] 8.1 Update the Purpose line of `openspec/specs/onslaught-progress-entry/spec.md` from `/progress/onslaught` to `/my-game/onslaught` at sync time; verify `openspec validate --specs`
- [ ] 8.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`, all passing
