# Add an app install guide and improve the web manifest

## Why

V1 showed mobile users a banner linking to an outside page about installing web apps. It forgot a dismissal on the next visit and offered nothing on desktop. V2 has no install offer at all, and its manifest had problems of its own. Its only icons were tagged maskable but had a transparent background with part of the logo outside the safe zone, so Android clipped them. It had no `start_url`, so the installed app opened on whatever page it was installed from. Its blue theme colour matched neither theme.

## What Changes

- Manifest: `any` icons plus real maskable icons (logo inside the safe zone on the dark canvas), `start_url: /home`, `scope: /`, `launch_handler` to reuse an open window, the canvas colour as theme and background, the landing description, `games`/`utilities`/`productivity` categories, and three shortcuts: Daily raids, Goals and Legendary events.
- `<meta name="theme-color">` follows the resolved light or dark theme, set before first paint and on every theme change.
- The browser's install prompt is held from startup. Home shows a dismissible install card: Install (one tap) where the browser offers a prompt, otherwise Show me how. Once the app is installed during the visit, the card becomes a shortcuts tip.
- The account menu gains Install app, which opens the guide: Install where available, otherwise the steps for iOS, Safari on macOS, Android or desktop Chromium, then the shortcuts the installed icon offers.
- Three declared analytics events: `app_install_guide_opened`, `app_install_prompt_answered`, `app_install_card_dismissed`.

## Capabilities

### New Capabilities

- `app-install`: the manifest's install surface and the in-app install offer and guide.

### Modified Capabilities

- `product-analytics`: declares the three install events.

## Impact

- `apps/web/public/site.webmanifest`, new maskable and shortcut icons under `apps/web/public/`, `apps/web/index.html`.
- New `widgets/app-install` slice; `pages/home`, `widgets/account-menu` (`AccountCard`), `app/providers/auth-control.tsx`, `shared/theme`, `shared/analytics`, `main.tsx`.
- `appInstall` keys in `common.json` (en/de/es/fr).
