## 1. No eval in the bundle

- [x] 1.1 Add `public/zod-config.js` setting `globalThis.__zod_globalConfig.jitless`, loaded as a classic script from `index.html` before the bundle, and list it as a knip entry
- [x] 1.2 Check in a browser with the policy enforced that the built app reports no `eval` violation (and that it does without the script)

## 2. Policy sources

- [x] 2.1 Add `https://collect.jotlens.com` to `connect-src` and `'self'` to `frame-src`
- [ ] 2.2 After deploy, confirm PostHog shows no `eval` reports from the app's own assets and no `collect.jotlens.com` or `redirect.html` reports
