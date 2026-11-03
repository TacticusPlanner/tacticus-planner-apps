# Spec Delta

## MODIFIED Requirements

### Requirement: Project cards communicate planning value

Every project card SHALL show color, name, description when present, and a goal/unit summary derived from the project's `goalIds` joined with the loaded goals list — no per-project read. Where summary data is available, the Default project card only SHALL also show reached, blocked, and estimate/progress information (completion date and unestimated goals), computed from the one global run. A non-archived project with a resolvable, not-ended target SHALL also show its deadline fit count (`project-deadline-fit`), from the same run. Other project cards show the goal/unit summary only. Identity and actions SHALL remain usable while the goals list or a summary calculation loads or fails.

#### Scenario: Summary loads progressively

- **GIVEN** project identity has loaded and the goals list or the summary calculation has not
- **WHEN** the card renders
- **THEN** identity/actions render with a summary skeleton

#### Scenario: One summary fails

- **WHEN** the goals list read fails
- **THEN** every card shows its identity with an unavailable/retry summary state, and one retry re-reads the goals list

#### Scenario: Targeted card shows its fit count

- **GIVEN** a project targets Guild War season 29 and 2 of its 4 counted goals fit
- **WHEN** its card renders with summary data available
- **THEN** it shows "2 of 4 fit" beside the "GW S29" chip
