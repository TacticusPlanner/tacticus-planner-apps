## Why

The `Content-Security-Policy-Report-Only` header has no reporting directive, so violations only appear in each visitor's own browser console. Nobody can see what the policy would block in production, which is the input needed before switching it to enforcing.

## What Changes

- The report-only policy gains `report-uri` and `report-to posthog`, and documents carry a `Reporting-Endpoints` header naming PostHog's CSP report endpoint for the app's existing (public) project token.
- Browsers then send each violation to PostHog, where it is stored as a `$csp_violation` event (blocked URL, directive, document URL, disposition).
- The policy's own directives are unchanged: this change only makes violations visible. Allowlist changes and the switch to enforcing follow once a week or two of reports has been reviewed.

## Capabilities

### Modified Capabilities

- `web-security-headers`: the report-only policy reports its violations to PostHog.

## Impact

- `apps/web/public/staticwebapp.config.json` only. No code, API or locale change.
- Staging and production share the PostHog project, so reports from both arrive there; `$csp_document_url` tells them apart.
