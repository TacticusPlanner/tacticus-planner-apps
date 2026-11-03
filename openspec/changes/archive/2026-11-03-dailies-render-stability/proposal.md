## Why

The web vitals review (`tacticus-planner-docs/analytics/reports/2026-11-web-vitals-review.md`) found the two most systematic problems on Dailies › Raids, the most-used daily page:

- **Opening Dailies freezes** (INP P75 2.6 s at `/dailies`). Measured on production (desktop, a real account), the tap that opens Dailies lands in a 714 ms frame with 645 ms of script: three 150-200 ms React render chunks running the raid engine (`calculateDailyRaids`: today, bonus raids and a full multi-day schedule) before the first paint. Slower phones and larger rosters multiply that.
- **Raids shifts on phones** (CLS P75 0.58, mobile P75 0.22 against desktop 0.07). On one dashboard track, the glance card shows only the Campaign event row while the raids load, and the Energy row is then inserted above it. Shops, which loads on its own, sits below the plan card and is pushed down when the plan arrives. Side by side (desktop) neither moves anything.

## What Changes

- `useDailyRaids` renders its loading state on the first render after mounting and runs the engine in a lower-priority render right after (`useDeferredValue(true, false)`), so the opening tap is followed by a paint. This applies to every page using the hook.
- Today's glance holds the Daily energy used tile's place with a loading placeholder while the raids load.
- On one dashboard track, Shop recommendations wait while the raids are loading. On two or four tracks they still show beside the loading plan, as specified.

Not in this change, pending element-level attribution from `web-vitals-attribution`: HSE, HRE, Guild raids, Campaigns, Guild members and Plan pages, and route skeletons. Measured on production, the route chunks load from cache in under 100 ms, and a spinner replaced by a page is not a layout shift, so skeletons are not indicated yet.

## Capabilities

### Modified Capabilities

- `daily-raids-today`: raids pages paint before the plan is calculated; the glance holds the energy tile's place while loading.
- `daily-shop-recommendations`: on one track the card waits for the raids to load.

## Impact

- `apps/web/src/fsd/features/daily-raids/model/use-daily-raids.ts`
- `apps/web/src/fsd/pages/dailies/ui/today/today-glance.tsx`, `today-dashboard.tsx` and their tests
- Every `useDailyRaids` consumer gets one extra render in the loading state on mount.
