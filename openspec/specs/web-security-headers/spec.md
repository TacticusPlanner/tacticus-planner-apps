# web-security-headers Specification

## Purpose

Defines the baseline security response headers the static host sends with the app's documents, so content sniffing, referrer leakage and unused browser features are constrained without breaking sign-in, analytics, feedback or catalog loading. A Content Security Policy is out of scope until launch hardening, which writes an enforcing policy directly.

## Requirements

### Requirement: Documents carry baseline security headers

Every document response from the static host SHALL include `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`.

#### Scenario: Entry document response

- **WHEN** a browser requests `/` or any path the hosting fallback rewrites to the entry document
- **THEN** the response carries all three headers with the stated values

### Requirement: Cache directives are unchanged by this policy

Adding security headers SHALL NOT change any `Cache-Control` directive already defined for the entry document, assets or the redirect page.

#### Scenario: Entry document still revalidates

- **WHEN** the entry document is requested after the headers are added
- **THEN** its `Cache-Control` still requires revalidation, as required by `app-error-recovery`
