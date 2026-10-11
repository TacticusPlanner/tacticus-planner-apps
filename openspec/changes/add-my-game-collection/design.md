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

- No filters, search, selection or click handling. The tile API leaves room for them (see D3) but none is wired. Click-through to the unit's Library page is Stage 4 work (see the proposal's stage table).
- No view switching, sort control, unowned toggle or overlay toggles. The handoff's Roster, Table and Showcase views and its Unowned toggle are tracked on the view-switching issue; filters and Sort are Stage 2.
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

The tile follows the Cards view in the design handoff (`tacticus-planner-docs/ux/wireframes/collection-handoff.md`, see D8): a round `RoundPortrait` image ringed in the `--rarity-*` token, overlays for stars, rank badge and shard crystal, then a one-line name, a row of number boxes and an equipment row. It renders as a non-interactive `role="group"`; Stage 4 turns it into a link to the unit's Library page (`/library/characters/:id`, `/library/machines-of-war/:id`) once those pages carry the V1 unit details. Its `aria-label` spells out the progression (localized rarity, stars and rank from the `progression` namespace) and every image inside is `alt=""`. With the name visible, the desktop tooltip is dropped. Tile copy lives under `unitTile.*` in `common`. Stage 3 can add an optional `selected` state and Stage 4 an optional link target without breaking callers.

The tile takes its width from its grid slot: the portrait is a square capped at 72px that shrinks to fit the slot, and every variant (owned, unowned, character, MoW, no-roster) reserves the same rows so tiles in a card share one height.

_Alternative:_ put the tile in `shared/ui`. Rejected: it encodes game-domain meaning (rank, rarity, equipment), which belongs in an entity.

_Alternative:_ port V1's composited rectangular portrait. Rejected in the design review: the round portrait was chosen and V1's look was called visually overloaded. V2 keeps V1's density by overlaying stars, rank and shards on the portrait instead of stacking rows under it.

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

The layout structure is the same on both: faction cards in a grid, units in fixed slots inside each card. The differences:

- **Desktop (>=768px):** faction cards in `repeat(auto-fill, minmax(min(30rem, 100%), 1fr))` with `align-items: stretch`, so cards share a width and a row height; seven unit slots per card row.
- **Mobile (<768px):** the same grid collapses to one column; five unit slots per row and smaller page padding.

Neither form has a tooltip. Joyride targets are the same `data-testid`s on both (`collection-summary`, `collection-faction-group` (first), `collection-owned-tile` (first owned), `collection-unowned-tile` (first unowned)). Only the step placement differs, so the tutorial exports `desktop` and `mobile` step arrays that share targets. The summary target is absent without a roster, so the tour skips that step via its existing missing-target handling.

### D6. i18n: rename `progress.*` to `myGame.*` in `common`, no new namespace

`nav.progress` / `nav.progressDescription` become `nav.myGame` / `nav.myGameDescription`, and the `progress.tabs.*` group becomes `myGame.tabs.*` (plus `collection` / `collectionDescription`). New page copy goes under `myGame.collection.*`. Unit, faction and ability names reuse the existing `characters` / factions game-data namespaces. Tour copy goes under `tour.collection.steps.*`.

### D7. The sync prompt reuses the shell's sync hook via a feature slice

The not-synced prompt offers the same Sync with Tacticus action as the shell, but that hook lived in `app/providers`, which pages may not import. The player-data status context and `usePlayerDataStatus` move to `shared/player-data-status` (the provider stays in `app` and provides it). `usePlayerDataSyncStatus` moves to a new `features/player-data-sync`. The sidebar button, mobile shell, quick action and the Collection prompt all call that one hook, so status text, the goal-cache refresh after sync, and the disabled-while-syncing guard cannot drift.

_Alternative:_ move only the context and let the page call `syncNow` itself. Rejected: it duplicates the goal refresh and syncing guard.

_Alternative:_ no button, just text pointing at the sidebar. Rejected: the spec asks for the action itself.

### D8. Cards view from the design handoff, with these deviations

`tacticus-planner-docs/ux/wireframes/collection-handoff.md` is the visual source for the Cards view. This change implements its Cards view, page width, faction header, unit tile, unowned and no-roster tiles, loading skeleton and tokens. It deviates where the handoff conflicts with code or earlier decisions:

| Handoff                                   | This change                                                                  | Why                                                                                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 5 unit slots per card row                 | 7 on desktop, 5 on mobile                                                    | 14 of 23 factions have 6 or 7 units; 5 slots would wrap most cards and miss the density target                             |
| Default order by an "investment" score    | Alliance, then name (unchanged)                                              | The score is a stand-in for power, which is out of scope; investment order comes with Sort                                 |
| Equipment as level-only squares           | Item icon in a rarity-coloured frame plus level                              | Keeps V1 parity ("everything V1 shows")                                                                                    |
| Tile is a link to a `/units/:id` stub     | Tile is not interactive yet                                                  | Click-through goes to the existing Library pages in Stage 4, together with the unit details they still lack                |
| One error state with "Browse the catalog" | Separate catalog and roster errors (D4)                                      | A catalog error has nothing to fall back to                                                                                |
| "Sync now"                                | Existing "Sync with Tacticus"                                                | One label for one action                                                                                                   |
| Mythic shards: open question              | One crystal: regular shards below the first blue star, mythic shards from it | Only one currency matters at a time; decided in review                                                                     |
| Shard crystal 34x30px, 12px count         | 22x20px with a 10px count                                                    | The larger crystal crowded the portrait (review). The count is the one text under 12px; the accessible name carries it too |
| Number boxes level, active, passive       | Active, level, passive; the level is a filled dark box                       | Matches the in-game layout so the level stands apart (review)                                                              |
| Unearned gold stars at 25% opacity        | Earned stars only                                                            | Matches the existing `progressionVisual` used across V2                                                                    |

### D9. Collection opts out of the page width cap; new tokens

`PageContainer` caps every page at 1600px. `MyGameLayout` passes `max-w-none` while the Collection route is active, so only Collection uses the full width; the other My Game pages keep the cap.

New theme tokens in `packages/ui/src/styles/globals.css` (both themes, registered with `@theme inline`): `--overlay` / `--overlay-foreground` (star pill, lock badge, text on faction bars and shard crystals), `--portrait` (portrait background while loading), `--progress` (unlock bar), `--info-bg` (sign-in/sync banner) and one `--faction-<id>` per catalog faction. Faction colours start from V1's `factions.json`, with the ones under 4.5:1 against white (Orks, Black Templars, Tau, Genestealers) darkened and duplicates separated; a unit test checks every faction token against white. Factions without a token fall back to `--muted-foreground`.

### V1 parity checklist (Who You Own, default view)

| V1 element                                                                                               | Decision                                                                                                                 |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Faction tiles (`FactionsGrid` / `FactionsTile`): faction icon, upper-cased name, colored gradient header | **Keep:** a header bar in a `--faction-*` colour token with the faction icon, upper-cased localized name and owned/total |
| MoWs inside their faction tile                                                                           | **Keep**                                                                                                                 |
| Faction header power / Blackstone pills                                                                  | **Drop** (out of scope)                                                                                                  |
| Roster header: total power, total Blackstone value                                                       | **Drop**; replaced by the owned summary                                                                                  |
| Roster header: Quick Filter text box                                                                     | **Defer** to Stage 2                                                                                                     |
| "Available (n)" / "Locked (n)" split (characters view)                                                   | **Redesign:** owned before unowned within each faction + one owned summary                                               |
| Portrait: rarity frame, stars, rank icon                                                                 | **Keep:** rarity ring on a round portrait, star pill and rank badge overlaid on it                                       |
| Portrait: XP level, ability badges, equipment, shards, mythic shards                                     | **Keep:** number boxes for XP and abilities, equipment row, shard and mythic crystals on the portrait                    |
| Locked: grayscale, shards + mythic shards                                                                | **Keep**, plus unlock target for characters                                                                              |
| Rank-up target indicator                                                                                 | **Drop** (not shown on WYO by default; candidate for Stage 2 "Ready to Rank Up")                                         |
| Hover title / tooltip                                                                                    | **Redesign:** the name is shown on the tile, so no tooltip                                                               |
| Click → edit dialog / unit details                                                                       | **Defer** to Stage 4: tiles will open the unit's Library page once it has the V1 details                                 |
| View controls, order-by, show-overlay toggles                                                            | **Defer** (view switching issue)                                                                                         |
| Share roster                                                                                             | **Drop** (not requested)                                                                                                 |
| Mobile `zoom: 0.8`                                                                                       | **Redesign:** five slots per row on mobile, the portrait shrinks to its slot                                             |

## Risks / Trade-offs

- [Breaking `/progress/*` URLs] → V2 is pre-production. The one in-app link is updated, and the old routes fall through to not-found as the spec requires.
- [Per-child visibility touches every nav consumer] → Filtering in one hook (D2) and adding tests per consumer (desktop menu, mobile tabs, drawer, search, last-visited resolution) keep the blast radius visible.
- [Tile density with all overlays on mobile] → Five slots per row keep the portrait readable at 420px. Overlay toggles and the Roster view are on the view-switching issue.
- [A faction grows past seven units] → Its card wraps to a second row; nothing breaks, that faction just loses the one-row layout.
- [MoWs show weaker unowned info than characters] → The catalog has no MoW rarity or unlock cost. Showing a shard count only is honest; adding the data would be an API change, out of scope.
- [~130 tiles render at once] → Tiles are lightweight images. Virtualization is not planned; revisit if profiling shows a problem.

## Migration Plan

There is no data migration. The change ships as one apps deploy. Rollback is reverting the deploy, which restores `/progress/*`.
