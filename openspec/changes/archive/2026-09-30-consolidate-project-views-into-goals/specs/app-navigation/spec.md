## REMOVED Requirements

### Requirement: Legacy Goals URLs redirect to Plan

**Reason**: This is a greenfield, pre-production app; the redirects were declared temporary when added, and one of their targets (`/plan/projects/{id}`) no longer exists. Rather than re-point it, the whole `/goals/*` mapping (route, `next`-path mapping, and helper) is deleted.
**Migration**: None. `/goals/*` falls through to the app's existing not-found handling; bare `/plan` continues to land on `/plan/goals` via the Plan section's own index route (unchanged, not a legacy redirect).
