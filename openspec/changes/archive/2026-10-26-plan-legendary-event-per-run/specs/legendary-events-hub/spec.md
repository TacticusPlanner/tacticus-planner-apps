## ADDED Requirements

### Requirement: A hub row lists every run's date of an unfinished event

A row of an active or upcoming event SHALL list runs 1 to 3 with their start dates: the announced date, or the guessed start (`legendary-event-run-date-estimate`) as "maybe ~<month year>", or "date unknown" when there is no guess. An archived row SHALL list none.

#### Scenario: Upcoming event with one announced run

- **GIVEN** Bile is upcoming with run 1 announced for 8 November 2026 and no other run announced
- **WHEN** the hub renders in English
- **THEN** Bile's row lists "Run 1: Nov 8, 2026", "Run 2: maybe ~May 2027" and "Run 3: maybe ~Oct 2027"
