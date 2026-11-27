## ADDED Requirements

### Requirement: The app evaluates no strings as code

The app's own scripts SHALL NOT call `eval` or `new Function`, so the Content Security Policy allows scripts without `'unsafe-eval'`. Zod's JIT, which probes and compiles with `new Function`, SHALL be turned off through `globalThis.__zod_globalConfig` by a same-origin classic script that the entry document loads before the bundle.

#### Scenario: Parsing data reports no eval violation

- **WHEN** the app builds and parses Zod schemas on any page
- **THEN** the browser reports no `script-src` violation for `eval` from the app's own assets

#### Scenario: The policy is enforced

- **WHEN** the policy is sent as `Content-Security-Policy` instead of report-only
- **THEN** the app loads and parses its data as it does under the report-only policy
