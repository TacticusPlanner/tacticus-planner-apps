# Proposal

## Why

The product owner reviewed the refined Legendary Event page (`refine-legendary-event-page`, PR #186) on a real account and sent six follow-ups on 2026-10-08. The Overview lane summary says how many battles are fully cleared but not how far each objective is, which is what decides where the next tokens go. The Overview leaderboard's objective filter is one undifferentiated chip row, so a reader cannot tell Alpha's objectives from Gamma's, and no chip says how many battles still need that objective. Overview rows show lane figures without the objective indicators the lane tabs have, so "why does this unit score 1,200 on Beta" needs a tab switch. Healer and Mechanic units matter for team building but are not marked. And the section nav lists only active events, so an upcoming or archived event's page is only reachable through the hub.

## What Changes

- **Lane summary objectives row**: each lane row gains a second line with one indicator per lane objective: the objective's icon, "cleared / battles" and a small bar in the existing lane accent colour. "Cleared" counts the lane's battles whose synced progress has that objective cleared.
- **Leaderboard filter grouping and counts**: on Overview the objective chips are grouped under Alpha / Beta / Gamma headings (one group per lane, in lane order) instead of merged into one row; on a lane tab the single group has no heading. Every chip's label is followed by "cleared / battles" for that lane's objective when synced progress is available. Selecting a chip keeps the existing filter semantics (the unit satisfies that objective; on Overview on at least one lane).
- **Overview objective indicators**: each lane cell of the cross-lane leaderboard shows that lane's objective icons as met / not-met indicators above the figure, exactly as the lane leaderboards do; a lane that disallows the unit keeps "—" with no indicators.
- **Healer / Mechanic markers**: a unit whose catalog traits include Healer or Mechanic shows that trait's icon after its name on every leaderboard, with the localized trait name as accessible text.
- **Nav lists every event, All events first**: the Legendary Events section's children become All events, then every catalog event in hub order (active, then upcoming, then archived), each with a lifecycle-specific description. The active child on `/legendary-events/:eventId` is the event's own child whatever its lifecycle, so active-child resolution prefers the most specific matching child path.
- **i18n**: new copy in `legendaryEvents` (lane summary objectives, chip count, lane group heading) and `common` (upcoming / archived event descriptions), en/de/es/fr.
- **Out of scope**: changing the filter semantics to per-lane selection; marking traits other than Healer and Mechanic; the deferred Stage 1 items (clear estimates, efficiency coefficient, unit-card menu).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `legendary-events-hub`: the Overview lane summary carries a per-objective cleared-count row.
- `legendary-event-eligibility`: objective chips grouped per lane with cleared counts; cross-lane rows carry per-lane objective indicators; Healer / Mechanic trait markers on leaderboard units.
- `app-navigation`: the Legendary Events section lists All events first and then every event, not only the active ones; the detail route activates the event's own child in every lifecycle.
