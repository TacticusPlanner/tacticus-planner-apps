## 1. Registry and storage path

- [x] 1.1 Add `storage-keys.ts` with every key, the preference records and their fields
- [x] 1.2 Type `safeStorage` to registered keys and add `safeSessionStorage`
- [x] 1.3 Add `useStoredPreference` / `useStoredFlag` with same-page and cross-tab sync and an in-memory fallback for refused writes; rebuild `usePersistedSelection` on it
- [x] 1.4 ESLint rule against direct `localStorage` / `sessionStorage` use

## 2. Callers

- [x] 2.1 Move every preference caller to its record field
- [x] 2.2 Move account data to `tp.user.*`; collapsed Goals sections and token reports under it, capped
- [x] 2.3 Session callers through `safeSessionStorage`
- [x] 2.4 PostHog `persistence: "localStorage"`

## 3. Migration and cleanup

- [x] 3.1 `migrateStorage()` at startup: preference keys, account keys, session keys, removed keys
- [x] 3.2 Remove the expired beta promo tile and its strings

## 4. Tests

- [x] 4.1 Unit tests for the migration, the registry and the preference hook
- [x] 4.2 Update caller tests to the new keys
