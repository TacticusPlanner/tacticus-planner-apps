## Context

See the proposal/spec. The prior status change supplies the active boss id, the existing `guild-raid-meta` dataset supplies ordered exact recommendations, and player-data supplies the current player's characters and Machines of War. The existing `entities/guild-raid-meta` boundary already resolves ids to presentation.

## Goals / Non-Goals

**Goals:**

- Add a pure, explainable comparison of exact authored lineups to ownership.
- Preserve editorial order and distinguish data absence from roster gaps.
- Integrate the result into both Guild Raids layouts without coupling it to the generic Dailies engine.

**Non-Goals:**

- Suggesting substitutions or a best achievable team.
- Applying minimum investment, boss-effectiveness, synergy, damage, or ranking formulas.
- Changing the API/catalog contract.

## Decisions

### Extend `entities/guild-raid-meta` with an exact-readiness resolver

The entity exposes a pure resolver accepting a boss id, Meta payload, owned character-id set, and owned Machine-of-War-id set. It returns discriminated absent/no-boss/no-roster/ready-results states plus recommendation rows. The UI receives presentation-ready ids through the existing resolver but owns page layout.

A configuration of the generic Dailies team engine was rejected: that engine ranks/pools arbitrary roster candidates, while exact readiness is a direct five-slot membership comparison with no candidate generation.

### Base classification only on the five exact heroes

Ready/Partial/Unavailable depends on the count of exact owned heroes. Machine-of-War ownership is adjacent information because a five-character attack remains meaningful without the recommended MoW. No hidden scalar readiness score is computed.

### Keep authored order canonical

The resolver returns recommendations in dataset order and slots in `heroIds` order. Desktop/mobile summaries derive from the same result rows. Investment facts can be displayed from player data but cannot affect order or classification.

### Compose within the Guild Raids page

The page adds a recommendation region below status/resources. It reads the same current-player source already used in Dailies; it does not introduce route-owned duplicated roster state. Status remains independently visible when Meta or roster data is absent.

### Responsive presentation and tutorial update

Desktop cards show the exact lineup and owned/missing summary together. Mobile cards put classification/missing count first and collapse Comp/source detail. The existing `guild-raids.tutorial.tsx` gains desktop/mobile exact-Meta steps with breakpoint-specific targets where markup differs.

## Risks / Trade-offs

- [Risk] Calling an exact team Unavailable when no heroes are owned can sound absolute → Label it explicitly as exact-Meta readiness and state that substitutions are not evaluated yet.
- [Risk] Meta data updates while the boss status is cached → Recompute reactively from both sources and preserve clear no-boss/absent states.
- [Risk] Investment display is mistaken for a recommendation score → Keep it per-unit and omit aggregate totals/ranking language.

## Migration Plan

Add the pure resolver/tests, then integrate the responsive cards and tutorial/i18n changes. This is additive and needs no persistence migration. Rollback removes the region while leaving status and catalog sync intact.
