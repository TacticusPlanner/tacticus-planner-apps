## Why

The four Mythic upgrade materials (`upgHpM001` Imperial Aquila, `upgHpM002` Mutant Form,
`upgHpM003` Ancient Inscription, `upgHpM004` Venerable Battle Mark) are needed for Character
Adamantine rank-ups (through Mythic crafted-upgrade recipes) and are consumed directly by
Machine-of-War ability upgrades. They cannot be crafted, and their only campaign drops are
event-only (Extremis event nodes). The daily shops (Guild, Crusade, Rogue Trader) are their
reliable source. Today the planner ignores those shops, so a goal like "Ragnar · Rank Adamantine 2"
is reported as Restricted ("Venerable Battle Mark ×6: No accessible farming location provides a
required resource.") with no completion date. Unlock and Ascension goals already let the player
pick shard shop offers; this change brings the same choice to Mythic materials.

## What Changes

- A **Mythic materials** acquisition-source control on Character Rank, Character and
  Machine-of-War Upgrade, and Machine-of-War Ability goals, shown on create and edit whenever the
  goal's range needs one of the four materials. It lists every daily-shop offer of each needed
  material, with the same per-offer details as the shard Shops group (shop, currency, cost, amount
  per purchase, daily cap, weekdays, rotating-slot chance, ≈ per-day yield).
- **Default: every currently available offer selected.** A goal with no saved selection
  (including every existing goal) uses all available offers, resolved at estimate time. Editing the
  control pins an explicit selection; an explicit empty selection opts out.
- The estimator feeds selected offers into the existing energy-free flat-supplier simulation for
  that material, so the material is scheduled and stops being a blocker when supplied.
- **Shared shop capacity in the Plan:** a shop offer's daily purchases are one pool shared by every
  goal that selects it, consumed in global goal-priority order (like per-battle daily attempt caps).
  A lower-priority goal only gets what higher-priority goals left that day.
- Raids Plan day cards' Shops section shows Mythic-material purchases (material art, quantity,
  currency) alongside shard purchases.
- The goal-creation "Resources needed" previews for these goal types show the shop currency the
  selected offers contribute, as the shard previews already do.
- Onboarding tour steps and i18n (en/de/es/fr) for the new control.

Companion API change: `tacticus-planner-api` — `add-mythic-material-shop-sources` (accepts
Mythic-material `Shop` entries on these goal types). It applies first.

## Capabilities

### New Capabilities

- `goal-mythic-material-sources`: the Mythic-material shop-offer control on Rank, Upgrade, and
  MoW Ability goals — when it appears, what it lists, its default, and how the selection persists.

### Modified Capabilities

- `goal-farming-estimates`: selected Mythic-material offers supply the material's need; a shop
  offer's daily capacity is shared across goals in the plan in priority order.
- `daily-raids-plan`: the Shops section lists Mythic-material purchases, not only shard purchases.
- `goal-edit-dialog`: the Edit goal dialog shows the Mythic-material control for the goal kinds
  that have it.

## Impact

- `packages/game-catalog/src/shops/shop-resolve.ts`: an offer resolver keyed by reward id (the
  Mythic materials) beside the per-unit shard resolver, sharing its per-weekday probability logic.
- `apps/web/src/fsd/features/goal-farming`: acquisition resolution for these goal types,
  default-all resolution, shared per-offer capacity in `estimatePlan`'s day loop.
- `apps/web/src/fsd/features/daily-raids`: Today/Raids Plan inputs and the Shops section.
- `apps/web/src/fsd/pages/goals`: create/edit controls, previews, tutorials.
- `apps/web/public/locales/*/common.json`: new copy in all four locales.
- No new dependency. Existing Unlock/Ascension shard behaviour is unchanged.
