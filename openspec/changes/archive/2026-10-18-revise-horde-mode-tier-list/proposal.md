## Why

The catalog `horde-mode-tiers` dataset is being revised (companion API change **`revise-horde-mode-tier-list`** in `tacticus-planner-api`, which applies first): a fifth tier D (×1.00, "evaluated, weak in horde modes") is added and the list grows from 21 to 47 re-rated characters. The client already renders tiers in catalog order, but D has no colour of its own and the Tier List spec still names four tiers and the old seed values.

## What Changes

- Give tier D its own tone (a dashed, muted outline) in `tierToneClass`, so D rows on the Tier List and D badges on team-picker tiles do not look untiered.
- Show five skeleton rows while the Tier List loads.
- Update the Tier List spec: five tiers (S, A, B, C, D) and worked examples from the revised data.
- Update the shared `horde-mode-tiers` test fixture to the revised data.
- No new strings: tier names come from the catalog, and the existing "Tier {{tier}}" label covers D.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `legendary-event-tier-list`: five tiers, revised worked examples.

## Impact

- `apps/web/src/fsd/entities/legendary-event/lib/tier-tone.ts`, `pages/legendary-events/ui/tier-list/tier-list-page.tsx`, `apps/web/src/test/fixtures/horde-mode-tiers.ts` and the tests that read them.
- Clear estimates, goals preview, team suggestions and upgrade impact pick up the new multipliers from the catalog with no code change.
