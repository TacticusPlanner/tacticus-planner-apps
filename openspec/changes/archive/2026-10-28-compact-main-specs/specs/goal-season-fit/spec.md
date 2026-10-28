## MODIFIED Requirements

### Requirement: Each eligible goal shows its season fit

With a mode on, a goal SHALL be **eligible** when it is Active, not Reached, not an Ability goal, and has a successful estimate with a Done By date. For an eligible goal the client SHALL compute its **completion instant** as the start of the day after its Done By date (00:00 UTC of Done By + 1 day), because Done By is an inclusive day. Its **offset** SHALL be the number of cycle boundaries strictly before the completion instant, counting from the current deadline: 0 when completion is at or before the deadline, 1 when at or before the next boundary, 2 for the one after, 3 or more otherwise. When fewer boundaries are known than the offset needs (non-`Fixed` definitions), an instant past the last known boundary SHALL count as 3 or more.

The offset SHALL be shown as a label beside the Done By date: 0 "This season", 1 "Next season", 2 "In 2 seasons", 3+ "Later". The label's tooltip SHALL name the deadline, e.g. "Done by Nov 14, before Battle Pass season 42 ends on Nov 15" (Battle Pass, Guild Raid) or "Done by Nov 3, before Guild War season 29 starts on Nov 28" (Guild War). The row (desktop) or card (mobile) SHALL also carry a left accent in the offset's colour (on track, caution, urgent, none for 3+). The label text SHALL meet the 4.5:1 contrast target and the accent 3:1 against its background in both themes (`goal-visual-accessibility`). Desktop and mobile SHALL show the same label and accent.

Ineligible goals (Ability, Paused, Reached, Blocked, unestimated) SHALL show no label and no accent; their existing Done By content is unchanged. The fit SHALL use the global-plan Done By date in project scope too, matching the Done By cell there.

Assumptions:

- Assumption: Done By already combines material and XP days and uses inclusive Day-1 semantics (`goal-farming-estimates`), so the fit agrees with the date the user sees.
- Assumption: a goal finishing on the deadline's own day before the reset is counted as the next season; the rule is deliberately conservative.

#### Scenario: Battle Pass fit, worked example

- **GIVEN** now is 2026-10-27T12:00Z, mode Battle Pass (deadline 2026-11-15T00:00Z, then 2026-12-20T00:00Z, 2027-01-24T00:00Z)
- **AND** four Active Rank goals with Done By 2026-11-14, 2026-11-15, 2026-12-25 and 2027-02-01
- **WHEN** fits are computed
- **THEN** their completion instants are 2026-11-15T00:00Z, 2026-11-16T00:00Z, 2026-12-26T00:00Z and 2027-02-02T00:00Z
- **AND** their offsets are 0 (at the deadline), 1 (after Nov 15, before Dec 20), 2 (after Dec 20, before Jan 24) and 3
- **AND** their labels read "This season", "Next season", "In 2 seasons" and "Later"

#### Scenario: Ability goals are ignored

- **WHEN** mode is Guild War and an Active Ability goal has Done By 2026-11-01
- **THEN** that goal shows no label and no accent

#### Scenario: Blocked goal

- **WHEN** an Active Rank goal's estimate is Blocked
- **THEN** it shows its blocked indicator and no fit label or accent
