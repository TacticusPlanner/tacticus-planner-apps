# Spec Delta

## Purpose

Defines the security response headers the static host sends with the app's documents and the policy they report or enforce, so script injection and content sniffing are constrained without breaking sign-in, analytics, feedback or catalog loading.

## ADDED Requirements

### Requirement: Documents carry baseline security headers

Every document response from the static host SHALL include `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` that denies camera, microphone, geolocation and payment.

#### Scenario: Entry document response

- **WHEN** a browser requests `/` or any path the hosting fallback rewrites to the entry document
- **THEN** the response carries all three headers with the stated values

### Requirement: Content Security Policy is reported before it is enforced

The static host SHALL send a `Content-Security-Policy-Report-Only` header whose policy allows only the app origin, the identity provider, the API origin, the analytics host and the feedback widget host for scripts and connections, and inline scripts only via the entry document's own hashes. Violations SHALL be reported to the analytics destination. The header SHALL NOT be switched to enforcing mode within this change.

#### Scenario: App runs with report-only policy

- **WHEN** a signed-in user signs in, syncs player data, opens the feedback widget and navigates between sections
- **THEN** no policy violation is reported for those flows

#### Scenario: Unexpected inline script

- **WHEN** an inline script not covered by a hash executes on the page
- **THEN** the browser reports a violation and the page is not blocked

### Requirement: Cache directives are unchanged by this policy

Adding security headers SHALL NOT change any `Cache-Control` directive already defined for the entry document, assets or the redirect page.

#### Scenario: Entry document still revalidates

- **WHEN** the entry document is requested after the headers are added
- **THEN** its `Cache-Control` still requires revalidation, as required by `app-error-recovery`
