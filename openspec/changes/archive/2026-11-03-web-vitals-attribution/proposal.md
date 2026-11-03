## Why

PostHog web vitals for V2 (review in `tacticus-planner-docs/analytics/reports/2026-11-web-vitals-review.md`) show poor CLS (P90 0.47, `/dailies/raids` P75 0.58) and INP needing improvement (P90 296 ms, entering Dailies P75 2.6 s). We cannot tell which element shifts or which interaction is slow: web vitals are captured with attribution off. Per-route numbers are also unreliable. The sanitizer rewrites each metric's URL to the route current _when the event is sent_, and PostHog sends LCP/FCP up to 5 s after measuring them, so a metric measured on one route is often reported against the next.

## What Changes

- Load PostHog's bundled `web-vitals-with-attribution` build instead of the plain one (still no CDN fetch) and turn attribution on for CLS, INP and LCP. Each `$web_vitals` event then carries PostHog's fixed allowlist of small fields: the CSS selector of the largest-shift element, the interaction target and type, the LCP element and its resource URL (query string removed), and timing phases. No text content, input values or DOM is sent.
- Report each web vitals metric against the route pattern of the URL it was measured on, not the route active when the event is sent.

## Capabilities

### Modified Capabilities

- `product-analytics`: web vitals are reported with diagnostic attribution, and each metric is labelled with the route it was measured on.

## Impact

- `apps/web/src/fsd/shared/analytics/analytics-provider.tsx`: attribution bundle and config.
- `apps/web/src/fsd/shared/analytics/capture-sanitizer.ts`: route pattern looked up by each URL's own path.
- Tests for both.
- PostHog: new properties (`$web_vitals_<METRIC>_event.attribution.*`) become available for breakdowns.
- Trade-off: PostHog notes that CLS attribution can keep detached DOM nodes alive in single-page apps. Accepted while CLS is being fixed. Turn CLS attribution off again once CLS meets its target.
