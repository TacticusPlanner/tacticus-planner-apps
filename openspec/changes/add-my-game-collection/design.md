## Context

See proposal.md for motivation and the stage plan. The current state that shapes the approach:

- **Navigation access is per section.** `NavItem.anonymousAllowed` exists only on top-level items; `app-shell.tsx` drops a whole section for anonymous users. `NavSubItem` has no access flag.
- **Routing guards are per section.** `app/routes.tsx` wraps all of `/progress` in one `ProtectedRoute` (= `AuthenticatedRoute` + `OnboardingGate`) around `ProgressLayout`. `pages/progress/route.tsx` contributes `campaigns` and `campaign-events`; `app/routes.tsx` splices in `onslaught` from the separate `pages/onslaught` slice. The index redirects to `/progress/onslaught`.
- **One in-app link targets `/progress`:** `pages/goals/ui/create-goal/acquisition-source-field.tsx` links to `/progress/onslaught`.
- **The data is already client-side.** `@workspace/game-catalog` provides `getCharacters()` (name, faction, alliance, `initialRarity`, active/passive ability names), `getMows()` (name, faction, alliance, primary/secondary ability; no rarity, no unlock cost), `getUnlockShardCosts()` (keyed by rarity, characters only) and `getEquipment()`. `@workspace/player-data` provides `getPlayerCharacters()`, `getPlayerMows()` (each `undefined` until its chunk syncs) and the `inventory-shards` chunk (shards/mythic shards for units _not_ in the roster). The catalog syncs for anonymous users (Library already depends on it).
- **Icons exist.** `characterIcon`, `mowIcon`, `factionIcon`, `rankIcon`, `rarityIcon`, `shardIcon`, `abilityIcon`, `EquipmentIcons` / `equipmentSlotIcon` and `progressionVisual` / `starsVisual`, plus `progressionRarity` / `progressionStarsIndex` in `@workspace/game-domain`.
- **No V2 character/MoW portrait component exists.** Only NPC and raid-boss portraits (`entities/npc`, `entities/raid-boss`); other pages render a bare `EntityIcon` with `characterIcon(id)`.
- **Ability convention.** Existing consumers read a player character's `abilities[0]` as active and `abilities[1]` as passive (`arena-recommendations.ts`, `build-guild-raid-exact-readiness-view.ts`), and a MoW's `abilities[0|1]` as primary/secondary (`mow-ability-calc.ts`).

## Goals / Non-Goals

**Goals:**

- A reusable unit tile that later stages (filters, selection, click-through) and other pages can build on without rework.
- One view-model that turns catalog + roster + shard inventory into faction groups, from which the summary count is also derived.
- Per-child anonymous access in navigation, done once in the nav model rather than special-cased for My Game.

**Non-Goals:**

- No filters, search, selection or click handling. The tile API leaves room for them (see D3) but none is wired.
- No view switching, sort control or overlay toggles (tracked as a separate issue).
- No power, Blackstone value or rank-up target indicator.
- No change to the Onslaught, Campaigns or Campaign Events pages beyond their route prefix.

## Decisions

### D1. Rename the `progress` page slice to `my-game`; Collection lives in it

`pages/progress` becomes `pages/my-game` (layout `MyGameLayout`, routes `collection`, `campaigns`, `campaign-events`, index → `collection`). `pages/onslaught` stays its own slice and is still spliced in by `app/routes.tsx` under `/my-game`. The Collection page UI is a new `pages/my-game/ui/collection/` folder.

_Alternative:_ a separate `pages/collection` slice spliced in like Onslaught. Rejected: Collection is the section's landing page and shares the layout. A new slice adds a second splice point for no isolation benefit.

### D2. Per-child access via `anonymousAllowed` on `NavSubItem`, filtered in one place

Add optional `anonymousAllowed?: boolean` to `NavSubItemBase`. A child without the flag inherits its section's value, so no existing child changes. The section-only filter in `app-shell.tsx` is replaced by one pure helper, `filterVisibleNavItems(items, isAuthenticated)` in `nav-items.ts`, which also filters children. `AppShell` passes its result as `visibleItems` and passes the _visible_ copy of the active section as `activeSection`, so the desktop sidebar and section menu, mobile tab row and drawer, navigation search and last-visited/default-child resolution all consume an already-filtered tree. A section that is anonymous-allowed but has zero visible children after filtering is dropped. The header title, description and document title keep resolving against the unfiltered tree, so a signed-out visit to a sign-in-only route still shows its title while the auth guard redirects. That is why filtering is not done inside `useNavItems`.

Routing mirrors it. The `/my-game` layout route is no longer wrapped. `collection` is unwrapped, while `onslaught`, `campaigns` and `campaign-events` are each wrapped in `ProtectedRoute`. So signed-in users still pass `OnboardingGate` on those three, and Collection behaves like the Library: no onboarding gate.

The last-visited-child memory may hold a child that becomes invisible after sign-out. Resolution falls back to the section's default child whenever the remembered child is not in the filtered list.

_Alternative:_ hard-code My Game in `app-shell.tsx`. Rejected: Stage 4 and Inventory will add more mixed sections, and every consumer (search, tabs, drawer) would need the same special case.

### D3. Unit tile is a new `entities/unit` slice with presentational components

`entities/unit` exports `UnitTile`, which takes one `UnitTileUnit` (`kind: "character" | "mow"`, `unitId`, localized `name`, and `data`). `data` is either an owned record (progression, rank, XP level, ability levels, equipment with resolved rarity, shards, mythic shards) or an unowned one (frame rarity, shards, mythic shards, unlock cost). Unknown ownership (no roster) or unknown shard data is an unowned record without shard counts, not a third state. The tile receives display data and does not fetch, so it stays reusable by Legendary Events and dailies.

The tile renders as a non-interactive `role="group"` named by the unit (so assistive technology still reaches the ability and shard labels inside it), focusable on desktop only so the shared `Tooltip` can show the name on keyboard focus. The rarity frame is a ring in the existing `--rarity-*` colour tokens, since V2 has no portrait-frame artwork. Tile copy lives under `unitTile.*` in `common`. Stage 3/4 will add an optional `onActivate`/`selected` without breaking callers.

_Alternative:_ put the tile in `shared/ui`. Rejected: it encodes game-domain meaning (rank, rarity, equipment), which belongs in an entity.

_Alternative:_ port V1's SVG-composited portrait. Rejected: V1 positions overlays absolutely on fixed 96×126 px art. V2 builds a compact CSS grid tile from the same icon assets so it scales with the layout.

### D4. One canonical view-model: `buildCollectionView(catalog, roster, shardInventory)`

A pure function in `pages/my-game/model/collection-view.ts` returns `{ rosterState: "available" | "notSynced" | "anonymous" | "error", groups: FactionGroup[], owned: number, total: number }`, where each group holds ordered `CollectionUnit` rows already shaped for `UnitTile`. Ordering, owned/unowned split, the unlock-cost lookup (`unlockShardCosts[initialRarity]`), active/passive mapping (`abilities[0|1]`) and the progression → rarity/stars mapping (`progressionRarity`, `progressionStarsIndex`) all happen here. The summary count is derived from `groups`, not computed separately. Stage 2 filters will run on this same structure.

Roster state:

- **anonymous:** not authenticated.
- **notSynced:** authenticated and both `getPlayerCharacters()` and `getPlayerMows()` return `undefined`.
- **error:** the read throws.
- **available:** otherwise. A synced `characters` chunk with an unsynced `mows` chunk treats MoWs as unowned.

A missing `inventory-shards` chunk gives unowned tiles `state: "unknown"`-style shard display (no count).

Faction order follows the domain's `allianceRank` (Imperial → Chaos → Xenos → Neutral), then localized faction name via the existing `factions` i18n namespace.

### D5. Desktop vs mobile

The layout structure is the same on both: faction groups as cards, tiles in a wrapping grid inside each card. The differences:

- **Desktop:** faction cards in a responsive multi-column grid (V1-like), tooltip on hover/focus.
- **Mobile:** single-column faction cards, a smaller tile size, no tooltip.

Joyride targets are the same `data-testid`s on both (`collection-summary`, `collection-faction-group` (first), `collection-owned-tile` (first owned), `collection-unowned-tile` (first unowned)). Only the step placement differs, so the tutorial exports `desktop` and `mobile` step arrays that share targets. The summary target is absent without a roster, so the tour skips that step via its existing missing-target handling.

### D6. i18n: rename `progress.*` to `myGame.*` in `common`, no new namespace

`nav.progress` / `nav.progressDescription` become `nav.myGame` / `nav.myGameDescription`, and the `progress.tabs.*` group becomes `myGame.tabs.*` (plus `collection` / `collectionDescription`). New page copy goes under `myGame.collection.*`. Unit, faction and ability names reuse the existing `characters` / factions game-data namespaces. Tour copy goes under `tour.collection.steps.*`.

### D7. The sync prompt reuses the shell's sync hook via a feature slice

The not-synced prompt offers the same Sync with Tacticus action as the shell, but that hook lived in `app/providers`, which pages may not import. The player-data status context and `usePlayerDataStatus` move to `shared/player-data-status` (the provider stays in `app` and provides it). `usePlayerDataSyncStatus` moves to a new `features/player-data-sync`. The sidebar button, mobile shell, quick action and the Collection prompt all call that one hook, so status text, the goal-cache refresh after sync, and the disabled-while-syncing guard cannot drift.

_Alternative:_ move only the context and let the page call `syncNow` itself. Rejected: it duplicates the goal refresh and syncing guard.

_Alternative:_ no button, just text pointing at the sidebar. Rejected: the spec asks for the action itself.

### V1 parity checklist (Who You Own, default view)

| V1 element                                                                                               | Decision                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Faction tiles (`FactionsGrid` / `FactionsTile`): faction icon, upper-cased name, colored gradient header | **Keep, redesign:** faction icon + localized name in a card header; the faction color accent is kept if a faction color token exists, otherwise neutral |
| MoWs inside their faction tile                                                                           | **Keep**                                                                                                                                                |
| Faction header power / Blackstone pills                                                                  | **Drop** (out of scope)                                                                                                                                 |
| Roster header: total power, total Blackstone value                                                       | **Drop**; replaced by the owned summary                                                                                                                 |
| Roster header: Quick Filter text box                                                                     | **Defer** to Stage 2                                                                                                                                    |
| "Available (n)" / "Locked (n)" split (characters view)                                                   | **Redesign:** owned before unowned within each faction + one owned summary                                                                              |
| Portrait: rarity frame, stars, rank icon                                                                 | **Keep** (`rarityIcon`/frame, `starsVisual`, `rankIcon`)                                                                                                |
| Portrait: XP level, ability badges, equipment, shards, mythic shards                                     | **Keep** (`abilityIcon`, `EquipmentIcons`, `shardIcon`)                                                                                                 |
| Locked: grayscale, shards + mythic shards                                                                | **Keep**, plus unlock target for characters                                                                                                             |
| Rank-up target indicator                                                                                 | **Drop** (not shown on WYO by default; candidate for Stage 2 "Ready to Rank Up")                                                                        |
| Hover title / tooltip                                                                                    | **Keep** on desktop (unit name only, no power)                                                                                                          |
| Click → edit dialog / unit details                                                                       | **Drop** in Stage 1; Stage 4 redirects to Library                                                                                                       |
| View controls, order-by, show-overlay toggles                                                            | **Defer** (view switching issue)                                                                                                                        |
| Share roster                                                                                             | **Drop** (not requested)                                                                                                                                |
| Mobile `zoom: 0.8`                                                                                       | **Redesign** as a smaller mobile tile size                                                                                                              |

## Risks / Trade-offs

- [Breaking `/progress/*` URLs] → V2 is pre-production. The one in-app link is updated, and the old routes fall through to not-found as the spec requires.
- [Per-child visibility touches every nav consumer] → Filtering in one hook (D2) and adding tests per consumer (desktop menu, mobile tabs, drawer, search, last-visited resolution) keep the blast radius visible.
- [Tile density with all overlays on mobile] → The smaller mobile tile shows the same data, and ability levels and equipment collapse to compact badges. Overlay toggles are the follow-up issue.
- [MoWs show weaker unowned info than characters] → The catalog has no MoW rarity or unlock cost. Showing a shard count only is honest; adding the data would be an API change, out of scope.
- [~130 tiles render at once] → Tiles are lightweight images. Virtualization is not planned; revisit if profiling shows a problem.

## Migration Plan

There is no data migration. The change ships as one apps deploy. Rollback is reverting the deploy, which restores `/progress/*`.
