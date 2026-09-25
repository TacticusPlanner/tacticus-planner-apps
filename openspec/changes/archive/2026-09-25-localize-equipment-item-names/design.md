## Context

Both shop pages call `features/shop-rewards/lib/shop-reward-display.ts`; its `I_*`/`R_*` branch currently prettifies IDs. Existing shop hooks load `shops`, `characters`, and `upgrades`, while `equipment:slots` is a separate UI-label namespace. V1 has four matching item-name sets for the current 214 catalog IDs.

## Goals / Non-Goals

**Goals:** Reuse one ID-based resolver in the shared shop-rewards feature and load its namespace in both consumers.

**Non-Goals:** Localize ability text, generic pools as specific pieces, or change served catalog shape.

## Decisions

- Add dynamic `equipmentItems` resources for en/de/es/fr and register the namespace in the typed i18n resources. Keep these names separate from equipment slot labels.
- Keep display resolution in `features/shop-rewards` (its public API already serves both shop pages). Pass the catalog equipment map/name lookup through the existing display context rather than importing a page or duplicating a resolver in each page.
- Resolve translation → catalog English → readable ID. Recheck key coverage against the implementation-time catalog; the four V1 sets are a source, not a promise that the catalog cannot change.

## Risks / Trade-offs

- A translated name may become stale as the game catalog changes → compare ID sets and retain English fallback.
- Dynamic namespace loading can briefly expose fallback labels → load `equipmentItems` before showing shop rewards in each consumer.

## Open Questions

- Does the current catalog still contain exactly the V1-covered IDs at implementation time? Record any new or removed IDs in the coverage check; do not invent translations for new game data.
