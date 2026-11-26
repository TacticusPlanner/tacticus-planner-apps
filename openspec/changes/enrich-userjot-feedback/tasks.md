## 1. Token context

- [x] 1.1 Pull the API document with the new optional query parameters
- [x] 1.2 Send app version, app mode and UI language with each token request, without re-identifying on a language change

## 2. Widget configuration

- [x] 2.1 Init with `pageContext: "path"` and `whispers: true`, keeping `notifications.updates: "none"`

## 3. Entry points

- [x] 3.1 Report a bug quick action opening the submit form
- [x] 3.2 Report a bug on the fallback error page (module-level open, since the shell is gone)
- [x] 3.3 Roadmap row opens the widget's Roadmap; link fallback when the widget failed and on public pages
- [x] 3.4 `?changelog=` / `?feedback=` deep links open the widget once and leave the URL

## 4. Copy and tests

- [x] 4.1 en/de/es/fr strings and privacy text
- [x] 4.2 Unit tests for targets, provider (context, init, deep links), quick actions, account menu, error page
- [ ] 4.3 Re-pin the OpenAPI document to the API merge SHA before merging
- [ ] 4.4 Manual check on staging: a post records its page and traits, a reply notice appears, deep links open the right post
