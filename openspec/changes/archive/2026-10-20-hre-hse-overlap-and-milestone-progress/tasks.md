## 1. HRE with a running HSE

- [x] 1.1 Pass the running rule-bearing HSE to the HRE raids and rank equal-cost nodes by its points per raid
- [x] 1.2 Show each row's event points and name the event in the note

## 2. HSE milestone progress

- [x] 2.1 Add `hseProgressPoints`, `hseCurrentMilestoneCell` and `hseMilestonesMax`
- [x] 2.2 Store milestones done and points in the current milestone per instance under a v2 key
- [x] 2.3 Replace the points-so-far input with the two progress inputs and a derived total

## 3. Header controls

- [x] 3.1 Remove the project selector, Raids Filters and Planning Settings controls from the HRE and HSE tabs

## 4. Verification

- [x] 4.1 Unit tests for the tie-break and the milestone progress, plus page tests for the note, the inputs and the removed controls
- [x] 4.2 Typecheck, lint, FSD lint, Prettier and the full web test run
