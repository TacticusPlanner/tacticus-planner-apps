# Spec Delta

## ADDED Requirements

### Requirement: Sign-in from the landing page ends on Home

A sign-in started from a bare `/` SHALL end on `/home`, including when the identity provider's redirect returns to the site root. A sign-in started from `/?next=…` SHALL end on that destination.

#### Scenario: Get started from the landing page

- **WHEN** a signed-out visitor on `/` activates "Get started, it's free" and completes sign-in
- **THEN** they land on Home without having to choose "Open planner"
