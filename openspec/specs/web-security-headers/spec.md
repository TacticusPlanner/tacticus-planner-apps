# web-security-headers Specification

## Purpose

Defines the baseline security response headers the static host sends with the app's documents, so content sniffing, referrer leakage and unused browser features are constrained without breaking sign-in, analytics, feedback or catalog loading. Beyond `frame-ancestors`, a Content Security Policy is out of scope until launch hardening, which writes an enforcing policy directly.

## Requirements

### Requirement: Documents carry baseline security headers

Every document response from the static host SHALL include `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`.

#### Scenario: Entry document response

- **WHEN** a browser requests `/` or any path the hosting fallback rewrites to the entry document
- **THEN** the response carries all three headers with the stated values

### Requirement: The app cannot be framed by another site

Every document response SHALL include `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY`, except the MSAL redirect page (`/redirect.html`), which the app loads in a hidden same-origin frame for silent sign-in and which SHALL instead carry `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN`.

#### Scenario: Another site embeds the app

- **WHEN** a page on another origin loads the app in a frame
- **THEN** the browser refuses to render it

#### Scenario: Silent sign-in still completes

- **WHEN** the app restores a session through a hidden identity-provider frame that returns to `/redirect.html`
- **THEN** the redirect page renders in that frame and hands the response back to the app

### Requirement: Cache directives are unchanged by this policy

Adding security headers SHALL NOT change any `Cache-Control` directive already defined for the entry document, assets or the redirect page.

#### Scenario: Entry document still revalidates

- **WHEN** the entry document is requested after the headers are added
- **THEN** its `Cache-Control` still requires revalidation, as required by `app-error-recovery`
