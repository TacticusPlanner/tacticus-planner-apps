## Why

When configuring an Unlock or Ascension goal, the shard-source control is a single-select
dropdown — `Campaign` / `Onslaught` / `Both` — with a separate campaign-node checkbox list.
It cannot express "campaign nodes **and** a shop", it hides Onslaught's yield behind a bare
label, and it has no concept of daily shops at all. Players who buy a unit's shards from a
daily shop (Guild Shop, Guild War Shop, Rogue Trader, Crusade Shop) therefore get pessimistic
shard-need and time/energy estimates, and the daily plan over-schedules campaign raids. The
`shops` game-catalog dataset (issue #75) already carries structured per-offer data — `unitId`,
currency, amount, `days`, `maxPurchasesPerDay` — specifically so this integration can land
without reshaping data; #75 deferred it and this change delivers it, alongside the control
redesign the multi-source model needs.

## What Changes

### Redesigned acquisition-source control

- Replace the single-select `Campaign` / `Onslaught` / `Both` dropdown with a **multi-select
  tree** on the Unlock and Ascension cards (create-goal sheet and goal detail/edit sheet).
  Any combination of the top-level groups can be selected at once.
- **Top-level groups: Campaigns, Onslaught, Shops.** A group is only rendered when it can
  actually contribute to _this_ goal for _this_ unit:
  - **Campaigns** — expandable; sub-options are the unit's campaign shard-farm nodes (the
    current checkbox list, still split by regular vs. mythic shard type per goal need). Hidden
    when the unit has no campaign shard node of a type the goal needs (e.g. a MoW).
  - **Onslaught** — Ascension goals only; no sub-options, a selectable leaf. When selected it
    shows the estimated character shards per Onslaught run derived from the player's saved
    Onslaught progress (sector/tier for the unit's alliance), with an inline reference/link to
    the Onslaught progress page to set or update that progress. (Onslaught grants shards and
    forge badges only, never ascension orbs, so there is no orb figure here.) Not rendered on
    Unlock cards.
  - **Shops** — expandable; sub-options are the specific daily-shop offers whose reward is
    this unit's character shards (`shards_<unit>` / `mythicShards_<unit>`), each row showing
    shop, currency, per-purchase cost, shards per purchase, daily purchase cap, and available
    weekdays. Hidden when no shop currently offers this unit's shards.
- A top-level group with no available sub-options **and** no standalone contribution is not
  rendered at all (no empty/disabled group headers). In practice: Unlock cards show Campaigns
  and Shops; Ascension cards show Campaigns, Onslaught, and Shops — each subject to the
  per-unit rules above.
- `shards_<unit>` vs. `mythicShards_<unit>` offers, and regular vs. mythic campaign nodes, are
  each offered only where the goal type/range can consume that shard type — Unlock and early
  Ascension use regular shards; blue-star-and-above Ascension uses mythic shards.

### Estimate integration

- The goal's **shard-need** calculation and farming estimate combine every selected source
  instead of a single one:
  - a selected **shop** offer supplies up to `shardsPerPurchase * maxPurchasesPerDay` shards
    on each available weekday, consuming no daily energy;
  - **Onslaught**, when selected (Ascension only), contributes its per-run shard yield at the
    current run cadence, as it does today;
  - **campaign** nodes contribute farmed shards as they do today.
- The combined supply reduces the shards that must be farmed from campaign nodes and lowers
  the estimated energy, raid count, and completion date. Every shared estimate consumer
  (Goals/Insights, Today, Raids Plan) reflects the same reduction.
- Ascension-orb need and its estimate are entirely unchanged by this change — Onslaught does
  not grant orbs, so there is nothing to add there.
- No behavior change for a goal that selects only campaign nodes.

### Persistence

- **BREAKING (pre-production, allowed per `tp-destructive-changes-policy` — V2 is greenfield):**
  the goal farming config replaces the `ascensionFarming.source` enum with an explicit
  selected-source set plus per-source id lists (campaign battle ids, shop offer ids), and the
  Unlock config gains the same source model (Campaigns + Shops; no Onslaught). Existing goals
  map to the equivalent source set on migration. This requires a **companion
  `tacticus-planner-api` OpenSpec change** (config request/response model, validation, OpenAPI
  - client type regeneration, data migration).
- The source-set representation is designed to be **extended additively**: a future
  `Incursion` source (a MoW-only, run-based source — TacticusPlanner/tacticus-planner-apps#106)
  must be addable as a new source value without another breaking config change. So the API
  models the selection as an open set of source entries — each a `{ kind, ids }` shape where
  `ids` is empty for run-based kinds (`Onslaught`, later `Incursion`) — rather than fixed
  per-source columns, and validation rejects a `kind` only by an allow-list it can grow.
  Adding `Incursion` is explicitly out of scope for this change (no `Incursion` value, UI
  group, or estimate wiring ships here); only the shape that admits it later is in scope.
- i18n: new `goals.*` keys (default namespace) for the group headers, the shop-offer row
  labels, and the Onslaught yield line; create-goal and goal-detail tutorial steps updated for
  the new control.

## Capabilities

### New Capabilities

- `goal-acquisition-source-picker`: The multi-select Campaigns / Onslaught / Shops shard-source
  control for Unlock and Ascension goals — each group's per-goal visibility rule (Onslaught is
  Ascension-only; a group with no sub-options and no standalone contribution is not shown), its
  sub-options (campaign nodes; shop offers filtered to the unit's shard rewards), the Onslaught
  shards-per-run line and its Onslaught-progress-page reference, the regular/mythic
  shard-type gating, and that the selected source set is persisted with the goal and restored
  on edit, in both the create-goal sheet and the goal detail/edit sheet, on desktop and mobile.

### Modified Capabilities

- `goal-farming-estimates`: The shard-need derivation combines multiple selected acquisition
  sources per goal — bounded energy-free per-day shop supply
  (`shardsPerPurchase * maxPurchasesPerDay` on the offer's available weekdays), the Onslaught
  per-run shard yield (Ascension), and campaign farming — so the campaign raid demand, energy
  total, raid count, and completion date shrink accordingly and identically across every
  shared estimate consumer.

## Impact

- **Frontend (`apps/web`):** the source control
  (`goal-farming-fields.tsx` / `AscensionFarmingFields`, `goal-shard-locations-field.tsx`,
  `use-shard-location-selection.ts`, `use-ascension-fields.ts`), the edit-sheet locations
  field, combined-goal spec building (`goal-spec-builder.ts`), the goal-farming shard estimate
  and progression preview (`features/goal-farming` — `estimate.ts`, `shard-energy-estimate.ts`,
  `use-progression-preview.ts`, shard-need derivation), the `goals.*` i18n keys, and the
  create-goal / goal-detail tutorials.
- **Game catalog:** reads the existing `shops` dataset through `@workspace/game-catalog`'s
  permissive (any-day, all-options) resolver, filtered to a unit's `shards_<unit>` /
  `mythicShards_<unit>` offers; reads Onslaught rewards via the existing `getOnslaughtRewards`
  query. No dataset or schema change.
- **API (`tacticus-planner-api`) — companion change required:** replace the goal farming
  config's `ascensionFarming.source` enum with an open selected-source set (`{ kind, ids }`
  entries, allow-listed `kind`), extend the Unlock config likewise, update validation and
  OpenAPI, regenerate the client type, and migrate existing goal rows. The set shape is chosen
  so a later `Incursion` source (#106) is a one-line allow-list addition, not a schema break.
  Tracked as a separate coordinated OpenSpec change.
- **Follow-up:** issue #106 (Incursion as a MoW acquisition source) builds on this change's
  source-set shape.
- **Depends on:** issue #75 (Shops dataset), already shipped.
