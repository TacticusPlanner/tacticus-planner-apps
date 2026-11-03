## 1. Responsiveness

- [x] 1.1 `useDailyRaids`: gate the engine on `useDeferredValue(true, false)` so the first render after mounting returns the loading state
- [x] 1.2 Existing daily-raids, Dailies, Home and Schedule tests still pass

## 2. Layout stability on Raids

- [x] 2.1 `TodayGlance`: a Daily energy used placeholder with a skeleton value while the raids load
- [x] 2.2 `TodayDashboard`: Shops hidden below 42rem while the raids load
- [x] 2.3 Tests for both

## 3. Verify after release

- [ ] 3.1 PostHog: `/dailies` INP and `/dailies/raids` CLS (mobile) at P75 a week after release
