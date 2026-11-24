## Context

`buildRadarPopulation` collects one population per axis from every catalog character, with a missing ranged attack as 0. `StatRadarCard` renders `RadarAxisResult.percentile` as the radar, the caption and the list. `v1-radar.fixture.json` pins all six axes to V1. See proposal.md for the motivation.

## Goals / Non-Goals

**Goals:**

- Represent "no ranged attack" as its own state, distinct from 0%.
- Keep one result structure behind the radar, caption and list.

**Non-Goals:**

- Counting ties as half, or rewording the "median character" footnote.
- Changing the damage formula, the reference or the Las pierce exception.
- Changing V1.

## Decisions

### D1. A missing attack is `null`, for the value and the percentile

`RadarAxisResult.value` and `.percentile` become `number | null`. The population drops nulls, so it holds only shooters on the ranged axes, and a shooter's denominator follows from it. Whether a character shoots is decided by `rangedDamage`, as today, not by value > 0: a shooter with an unknown damage type still counts, at 0. Rejected: filtering zero values, which would drop such a shooter.

### D2. Round the damage axes to two decimals

Damage and hits are integers and pierce ratios are whole percentages, so every exact product has at most two decimals. `Math.round(value * 100) / 100` therefore removes only floating-point noise. Rejected: rounding to whole damage, which creates ties that aren't real and moves 17 melee values instead of six (for example Ramus, 4,005.75 against 4,006).

### D3. The tooltip is a button beside the axis label in the list

Both ranged rows get an info-icon button using `@workspace/ui` `Tooltip`, which also opens on tap, on desktop and mobile alike. The button's accessible name is its own short label, and the tooltip carries the sentence. It is shown for melee-only characters too. Rejected: goal-planning's `InfoHint`, which relies on `title` and does not open on touch. The SVG stays decorative and gets no tooltip.

### D4. Rendering without a percentile

The list row shows "No ranged attack" in place of the bar and percentage. The radar vertex is drawn at the same just-off-centre position as 0%, keeping the hexagon shape, and the caption reads "No ranged attack" for that axis.

### D5. V1 parity covers four axes

The fixture's Health, Armour and melee expectations stay; its ranged expectations are no longer asserted. If a melee expectation moves, confirm that it is a floating-point tie before changing it.

V1 parity: radar layout, axis order, 50% outline, reference and wiki link kept; ranged population and the melee-only state redesigned.

## Risks / Trade-offs

- [V1 players see lower ranged percentiles] → The tooltip and the changelog explain the comparison.
- [A melee-only radar looks like a character with 0% ranged] → The list and caption name the state.
- [Longer row text on narrow screens] → Verify at 420px, in German and French too.
