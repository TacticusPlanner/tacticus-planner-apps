# Design

## Context

The master table, tier list and leaderboard controls build their chips from the shared `ToggleGroup`/`Toggle` of `@workspace/ui`, whose on-state is `data-[state=on]:bg-muted`; in the light theme `--muted` is almost the page background (measured: selected chip fill oklch 0.949 against a near-identical page, border and text colour unchanged), so a pressed chip (`aria-pressed=true`) looks unselected. The same group is used by the theme switcher, goal forms and the library header. The event page tour is configured in `legendary-event.tutorial.tsx` with `data-testid` targets; the Token plan step targets the whole card (`legendary-event-token-plan`), so with 24 tokens listed the tooltip, placed "bottom"-relative to a target taller than the viewport, ends up above it and is clipped. The lane summary and Run status labels come from `laneSummary.battles` ("{{cleared}} / {{total}} battles") and the run status currency line. Teams are shown through their stored `name`; imported V1 teams store the lane id as the name. See proposal.md for the evidence.

## Goals / Non-Goals

**Goals:**

- A selected chip is unmistakable in both themes, with or without colour vision.
- The tour never shows a clipped tooltip.
- Labels say what the number is.
- A team is identifiable by name wherever it appears.

**Non-Goals:**

- Redesigning the shared toggle-group (other pages use it; its visual change needs its own review).
- Renaming teams in storage or in the import mapper.
- Reworking the lane overview's "kill points per battle" wording.
- Changing figures or calculations.

## Decisions

**D1. Fix chips at the call sites with one shared class.** The three Legendary Event files import one chip class (or a thin `FilterChip` wrapper in `shared/ui`) that sets `data-[state=on]:border-2 data-[state=on]:border-primary data-[state=on]:bg-primary/10` and keeps the pressed state. Alternative: change the shared `toggle-group` on-state. Rejected for this change: the theme switcher and goal forms rely on it and each needs its own visual check; the owner can promote the class later. The 3:1 border contrast is asserted by a test that reads the resolved colours for both themes.

**D2. The Token plan step targets the header.** A `data-testid="legendary-event-token-plan-header"` on the card's header row (the spec already says "Token plan header"), the step placement stays "bottom", and Joyride's scroll offset keeps the header in view, so the tooltip never depends on the list's height. Alternative: cap the list height. Rejected: it changes the list UX.

**D3. Labels, not numbers.** "N / M battles fully cleared" and "N currency in hand" are copy changes in four locales; the figures are unchanged. V1's different figures (defeat-all clears, cumulative currency) are explained by the labels rather than reproduced.

**D4. A display-name function, not a stored rename.** `teamDisplayName(team, laneObjectives, laneTeams)` returns the stored name unless it is empty or equals the lane id (case-insensitive), then the covered objective labels joined by " · ", else "Team N" (position in the lane). Every place that names a team calls it. The editor prefills the same value for such a team, so saving stores a readable name; display alone writes nothing. Alternative: normalise in the V1 import so teams arrive named. Rejected here: it would leave the existing "alpha" teams and would belong to the API import; the display rule covers both.

**D5. Desktop and mobile.** The chip class and the labels are shared; the tour change applies to both forms (mobile already scrolls targets into view; the header target is shorter on both).

## Risks / Trade-offs

- [A chip that looks different on three pages but not on others] → Documented as a follow-up in the tasks (promote to the shared component after reviewing its other consumers).
- [A derived team title can be long] → The card truncates with the full title in a tooltip; prompts use it as is (they already name a team).
- [Two teams with the same objectives show the same title] → Acceptable: they share the same covered objectives; their members differ in the portraits shown beside the name.

## Migration Plan

Client-only, no flag. Roll back by reverting.
