# Proposal

## Why

The merged UserJot post [Enhancements for Project Organization and Goal Management](https://tacticusplanner.userjot.com/board/p/enhancements-for-project-organization-and-goal-management) asks for a project visual better than a colour dot, such as the first few characters' portraits.

Agreed with Severyn on 3 Nov (decisions 42 to 44 in the planning notes):

- Cards show the first 4 unit portraits, then "+N", and the colour dot stays.
- Portraits also show on the home widget.
- An icon library is out of scope for now.

## What Changes

- **Portraits** on project cards (Projects page and home widget): the first 4 distinct units among the project's in-flight goals, in priority order, then "+N".

## Capabilities

### Modified Capabilities

- `project-management`: cards show portraits.
- `home-projects-widget`: cards show portraits.

## Impact

- `features/project-management/ui/project-unit-portraits.tsx` (uses `entities/unit`), the card in `features/project-management/ui/project-summary-row.tsx`, `pages/home` (widget size).
- `common` `goals.project.portraits.*` accessible label in en/de/es/fr.
- No API change and no extra read: the card already joins `goalIds` with the goals list. Independent of the other changes.
