## Purpose

Defines how a mobile onboarding-tour step that force-opens an animated UI
element (a drawer or popover) before targeting it waits for that element to
finish opening, so the tour measures and spotlights its final position and
size rather than a mid-animation one.

## ADDED Requirements

### Requirement: A tour step waits for its force-opened target to settle before measuring it

When a mobile tour step's `before` hook force-opens an animated element in
order to target content inside it, the tour SHALL wait until that element
has appeared and its layout has stopped changing before allowing Joyride to
measure or spotlight the target. The tour SHALL NOT rely on a fixed,
unconditional delay as its sole readiness signal. The wait SHALL be bounded
by a safety timeout so the tour still proceeds if the element never
finishes settling, rather than hanging indefinitely.

#### Scenario: Step waits past a slower-than-usual open animation

- **GIVEN** the account-menu tour step force-opens the account drawer and
  the drawer's open animation takes longer than the previous fixed delay
  would have allowed
- **WHEN** the step becomes active
- **THEN** the tour spotlights the drawer's final, fully-open position and
  size, not a mid-animation one

#### Scenario: Step proceeds without waiting once already settled

- **GIVEN** the force-opened element's layout has already stopped changing
- **WHEN** the step becomes active
- **THEN** the tour does not wait any longer than necessary before
  measuring the target

#### Scenario: A safety timeout prevents an indefinite wait

- **GIVEN** the force-opened element never finishes settling (or never
  appears)
- **WHEN** the step becomes active
- **THEN** the tour proceeds after a bounded maximum wait rather than
  hanging

### Requirement: The readiness wait applies uniformly to every target the step matches

The account-menu step's `before` hook targets either the signed-in account
drawer or the guest settings popover, depending on auth state. The
readiness wait SHALL apply the same way regardless of which of the two
renders.

#### Scenario: Signed-in account drawer

- **GIVEN** a signed-in user takes the mobile tour
- **WHEN** the account-menu step force-opens the account drawer
- **THEN** the tour waits for the drawer specifically to settle before
  measuring it

#### Scenario: Guest settings popover

- **GIVEN** an unauthenticated user takes the mobile tour
- **WHEN** the account-menu step force-opens the guest settings popover
- **THEN** the tour waits for the popover specifically to settle before
  measuring it
