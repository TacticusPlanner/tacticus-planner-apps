# Tasks

## 1. Manifest

- [x] 1.1 Add `any` and safe-zone maskable icons, `start_url`, `scope`, `launch_handler`, canvas colours, description, categories and the three shortcuts with icons.
- [x] 1.2 Set `<meta name="theme-color">` from the resolved theme before first paint and in `ThemeProvider`.

## 2. Install offer

- [x] 2.1 Hold `beforeinstallprompt` from startup and track `appinstalled`; verify with `install-prompt-store.test.ts`.
- [x] 2.2 Detect the install platform from the user agent; verify with `install-platform.test.ts`.
- [x] 2.3 Home install card with Install / Show me how / Not now and the post-install shortcuts tip; verify with `install-app-card.test.tsx`.
- [x] 2.4 Install app row in the account menu opening the guide.
- [x] 2.5 Keep the guide's shortcut list in step with the manifest; verify with `app-shortcuts.test.ts`.

## 3. Analytics and copy

- [x] 3.1 Declare and capture the three install events; verify with `analytics-provider.test.tsx`.
- [x] 3.2 Add `appInstall` copy in en/de/es/fr.
