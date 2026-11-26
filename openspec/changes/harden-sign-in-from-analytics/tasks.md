## 1. Redirects survive stale-build recovery

- [x] 1.1 Hold stale-build reloads from the moment a redirect is marked pending until it is taken back (redirect could not start, or the next load)
- [x] 1.2 Record the returned-to page's navigation type on `*_returned` steps
- [ ] 1.3 After release, confirm fast `no_response` returns on Firefox and WebKit drop, and check `navigation_type` on any that remain

## 2. Silent restore

- [x] 2.1 Skip the hidden-frame check on Samsung Internet
- [x] 2.2 Stop the restore after a cached-token failure that is a network error (no frame, no quiet renewal, no cooldown)

## 3. Sign-in step reporting

- [x] 3.1 Stamp the sign-in method on return steps (from the account hint, or the account a redirect signed in)
- [x] 3.2 Stamp the recording build on every step and send it as `recorded_app_version`
