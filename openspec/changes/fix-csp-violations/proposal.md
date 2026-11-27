## Why

Two days of `$csp_violation` reports in PostHog show what the report-only policy would block if it were enforced:

- `script-src` `eval`: about 3,000 events from about 700 users. Two thirds come from our own bundle: Zod 4 probes `new Function("")` when an object schema is built and, because report-only lets the probe succeed, then compiles its object parsers with `new Function`. The other third comes from the UserJot SDK (`uj.js`), which bundles its own copy of Zod.
- `connect-src` `https://collect.jotlens.com`: about 410 events. UserJot's widget sends its analytics there.
- `frame-src` `/redirect.html` on the app's own origin: 18 events. MSAL's hidden sign-in frame returns to the redirect page, and `frame-src` lacks `'self'`.
- `script-src-elem` inline from Firefox `sandbox eval code` and `wasm-eval` from `chrome-extension`: browser extensions, not the app.

## What Changes

- A same-origin classic script (`public/zod-config.js`), loaded from `index.html` before the bundle, sets `globalThis.__zod_globalConfig.jitless`. Zod then neither probes nor uses `new Function`, so our bundle needs no `'unsafe-eval'`. A module imported from `main.tsx` would be too late: shared chunks that build schemas evaluate before the entry chunk's body.
- `connect-src` gains `https://collect.jotlens.com`; `frame-src` gains `'self'`.
- `script-src` keeps no `'unsafe-eval'`. UserJot's Zod keeps its config private, so its probe still reports one violation per page load; under an enforcing policy the probe throws, Zod falls back to its interpreter and the widget still works.
- The policy stays report-only. Switching to enforcing is a separate decision once the reports are clean.

## Capabilities

### Modified Capabilities

- `web-security-headers`: the app runs without `eval`, and the report-only policy allows UserJot's analytics endpoint and same-origin frames.

## Impact

- `apps/web/public/staticwebapp.config.json`, `apps/web/index.html`, new `apps/web/public/zod-config.js`, `apps/web/knip.json`.
- Zod parses with its interpreter instead of compiled object parsers. This is what already happens under an enforcing policy, and in Cloudflare Workers; parsing large payloads is somewhat slower.
