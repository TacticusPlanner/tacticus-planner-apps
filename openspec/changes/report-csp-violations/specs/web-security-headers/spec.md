## MODIFIED Requirements

### Requirement: A report-only Content Security Policy lists every origin the app uses

Every document response SHALL include a `Content-Security-Policy-Report-Only` header that allows scripts only from the app's own origin and the UserJot CDN, and network connections and frames only to the app's own origin, the API, the sign-in authority, PostHog and UserJot. The entry document SHALL contain no inline script, so the policy needs no hash or nonce. The policy SHALL report each violation to PostHog's CSP report endpoint for the app's PostHog project, through both `report-uri` and `report-to` (with a matching `Reporting-Endpoints` header), so violations seen by real visitors can be reviewed before the policy is enforced.

#### Scenario: Normal use reports no violation

- **WHEN** a user signs in, syncs, browses the app and opens the feedback board on staging
- **THEN** the browser console shows no Content Security Policy report

#### Scenario: Theme still applies before first paint

- **WHEN** the entry document loads with a stored dark theme
- **THEN** the dark theme is applied before the app renders, from a same-origin script file

#### Scenario: A violation reaches PostHog

- **WHEN** a visitor's browser loads a resource the report-only policy does not allow
- **THEN** the resource still loads, and the browser sends a violation report to PostHog, where it is recorded as a `$csp_violation` event with the blocked URL, the violated directive and the document URL
