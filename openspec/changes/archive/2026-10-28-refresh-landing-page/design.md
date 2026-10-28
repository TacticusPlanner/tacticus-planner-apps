# Design

## Context

See proposal.md - Why. `LandingRoute` (`app/auth-route-guards.tsx`) renders `AuthResolving` while MSAL is busy, redirects a signed-in visitor to `next` or `/home`, and otherwise renders `LandingPage`, the one route that is not lazy-loaded. `LandingPage` owns its own sign-in handler (`instance.loginRedirect(loginRequest)` plus a toast), as does `AuthControl` in the app shell. The shell's guest preferences (`GuestPreferencesCard` in `widgets/account-menu`) bundle theme, language, Roadmap and a Changelog row that needs the UserJot provider, which only the app shell mounts. Game sprites are copied byte for byte from data-mines `sprites-webp/` per `apps/web/datamine/sprites.txt` and addressed with `datamineAssetUrl()`.

## Goals / Non-Goals

**Goals:**

- One public layout for the landing and privacy pages, owned by the app layer like `AccountSetupLayout`.
- One sign-in code path for every signed-out entry point.
- No new runtime dependency, no change to the landing route's eager loading or to the auth redirect behaviour.

**Non-Goals:**

- An Open Graph image. It needs an absolute production URL, which V2 does not have yet; title and description tags ship now.
- A live demo built from sample data, a feedback widget for signed-out visitors, or a Joyride tour for public pages (the tour runner and its steps are app-shell features for signed-in users).
- Moving `AuthControl`'s sign-in to the new hook (it carries richer error logging and is untouched here).

## Decisions

1. **`PublicLayout` lives in `app/layout/public-layout.tsx` and wraps children, not an `<Outlet />`.** `LandingRoute` returns `<PublicLayout><LandingPage /></PublicLayout>` only on its signed-out branch, so the `AuthResolving` spinner and the signed-in redirect never flash the public chrome. `/privacy` is its own route element `<PublicLayout><PrivacyPage /></PublicLayout>`, outside `AppShell`, `ProtectedRoute` and the onboarding gate. The app layer may import the account-menu widget and both pages; the pages import nothing from each other or from `app`.
2. **Sign-in becomes `useSignInRedirect()` in `shared/auth`.** It returns `{ signIn, disabled, checkingSignIn }`: `disabled` while MSAL has an interaction in progress, `checkingSignIn` while the silent sign-in check runs, and `signIn` calls `loginRedirect(loginRequest)`, logs an `AuthError`'s code and message, and toasts `common:auth.error`. The top bar and the hero both use it. `landing:authError` stays because `my-game` Collection still reads it.
3. **Preferences in the top bar reuse `GuestPreferencesCard` inside a `Popover`, with `onChangelog` made optional.** Without it the Changelog row is not rendered; mobile header and desktop guest menu keep passing it, so their behaviour is unchanged.
4. **New external URLs live in `shared/config/external-links.ts`**: `DISCORD_INVITE_URL` (`https://discord.gg/8mcWKVAYZf`, the invite V1 uses as `discordInvitationLink`) and `GITHUB_ORG_URL` (`https://github.com/TacticusPlanner`). The UserJot board URL stays owned by `widgets/account-menu/model/userjot-links.ts` and is exported from the widget's public API for the footer; moving it to `shared/config` would break the 19 tests that mock that module with a fixed factory.
5. **Desktop and mobile differ only by responsive layout, not structure.** The same markup reflows with Tailwind breakpoints at `md` (768px, matching `useIsMobile`): the example plan card and the top-bar Library link are `hidden md:…`, feature cards go from two to four columns, Library cards from one to three. No `useIsMobile()` branch is needed, so first paint never depends on a media-query hook.
6. **The example plan card is static JSX with localized strings and three fixed portraits** (Celestine, Dominus, Atlacoya round portraits already in `sprites.txt`). It reads no catalog or player data, so the landing page does not wait on the game catalog, which needs the API.
7. **Art is decorative.** Background and planet are CSS backgrounds / `alt=""` images with `aria-hidden`; icons and portraits sit next to text that names them. Below-the-fold images use `loading="lazy"` and explicit sizes. The new sprites are ui `ui_image_background_desktop` (124 KB) and `ui_homescreen_planet_01` (32 KB), atlases `ui_icon_tabs_heroes`, `ui_icon_tabs_shop`, `ui_icon_tabs_battle`, `ui_icon_menu_guildboss`, `ui_icon_menu_quests`, `ui_icon_menu_achievements`. Their bytes match the pinned release `v1.43.157.2989` (`b694130`).
8. **Privacy text is a new `privacy` namespace**, loaded on demand by the lazy page and registered in `i18next.d.ts`. Sections are rendered from an ordered list of keys so all four locales share one layout.
9. **The page keeps one `h1`.** The public layout renders a `main` landmark with `id="main"` around the page; the landing hero owns the `h1`, sections use `h2`, cards use `h3`.

## Risks / Trade-offs

- [The Discord invite expires] → it is one constant in `shared/config/external-links.ts`; V1 has used it for months.
- [Privacy text drifts from what the API stores] → the spec lists each claim; any change to data stored, analytics or third parties must update `privacy-policy` in the same change.
- [Extra bytes on the eager landing route] → about 160 KB of WebP art loads after first paint as CSS/`img`; JS grows only by the layout and the static card.
