## 1. Attribution

- [x] 1.1 `loadSdk()` imports `posthog-js/dist/web-vitals-with-attribution`; `capture_performance.web_vitals_attribution` lists CLS, INP and LCP
- [x] 1.2 Test: the SDK is initialised with attribution on

## 2. Route labelling

- [x] 2.1 `capture-sanitizer`: remember the route pattern for each reported path; rewrite a page URL to the pattern of its own path, falling back to the current pattern
- [x] 2.2 Tests: a web vitals metric measured on an earlier route keeps that route's pattern; unknown paths still get the current pattern; parameter values never appear

## 3. Follow-up (PostHog app, no code)

- [ ] 3.1 After release, add CLS `largestShiftTarget` and INP `interactionTarget` breakdowns to the Web vitals dashboard
