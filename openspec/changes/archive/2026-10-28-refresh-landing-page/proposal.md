## Why

The signed-out landing page (`apps/web/src/fsd/pages/landing/ui/landing-page.tsx`) is the first thing a new visitor sees, and today it does not explain the product. It is one centred heading, a small "Sign in / Get started" button and three Library cards with generic Lucide icons. It never names the planning features behind sign-in (goals, daily raids, Legendary Events, guild raids), does not say the planner is free or that setup needs a Tacticus API key, shows no game art, and has no header or footer: no way back from the Library, no language or theme choice before sign-in, no fan-project disclaimer, and no Discord, GitHub, feedback or privacy link. On mobile the content touches the top edge when it overflows (`justify-center` with no top padding). `index.html` carries a title but no description, so shared links render as a bare URL. There is also no privacy page anywhere in V2, although the app signs users in, stores an encrypted Tacticus API key and reports product analytics for identified users.

Research and mockup: project doc "Landing page facelift research" (2026-10-27). Decisions taken on it by the maintainer: use the outcome-led headline from the mockup, a static product-preview illustration, footer links to Discord, the GitHub organization, the UserJot feedback board and a new privacy page, no in-page feedback widget for signed-out visitors, and one change/PR.

## What Changes

- The landing page and a new privacy page render inside a shared public layout: a top bar (app logo and name, a Library link, a preferences menu with theme and language, and Sign in, or "Open planner" for a signed-in visitor) and a footer (unofficial fan-project disclaimer; Discord, GitHub, Feedback board and Privacy links; the UI Kit link outside production).
- Landing hero: datamined space background and planet art, gold eyebrow, the headline "Know what to do today, and why it matters.", one sentence on what the planner does, a large primary "Get started, it's free" button that starts sign-in, a secondary "Browse the library" link, and three trust points (syncs via a Tacticus API key, works on phone, open source).
- A static, clearly labelled example "Today's plan" card beside the hero on desktop, built from character portraits; hidden on mobile.
- A "Plan every part of your account" section with four feature cards (Goals, Daily raids, Legendary Events, Guild raids), each with an in-game menu icon.
- Library section: three equal cards (Characters, Guild Raid Bosses, Daily Shops) with in-game icons in place of Lucide icons, a portrait preview row on Characters and Raid Bosses, and a line linking Machines of War and NPCs.
- New public `/privacy` route with a plain-language privacy notice covering what the planner stores, analytics, third parties, and how to delete an account.
- `index.html` gains a meta description and Open Graph / Twitter title and description.
- Eight sprites are added to `apps/web/datamine/sprites.txt` and copied from the pinned data-mines release.

## Capabilities

### New Capabilities

- `landing-page`: content, layout and actions of the signed-out landing page and the shared public top bar and footer.
- `privacy-policy`: the public privacy page and how it is reached.

### Modified Capabilities

- none. `redirect-authentication` (sign-in and the `next` round trip), `userjot-widget` (no proactive UserJot UI on the landing page) and `product-analytics` (no capture for signed-out visitors) are unchanged and still hold on both public pages.

## Impact

- `apps/web/src/fsd/pages/landing/` (rewritten), new `apps/web/src/fsd/pages/privacy/`.
- `apps/web/src/fsd/app/layout/public-layout.tsx` (new), `app/auth-route-guards.tsx`, `app/routes.tsx`.
- `apps/web/src/fsd/shared/auth/` (new `useSignInRedirect` hook), `shared/config/` (Discord and GitHub link constants), `widgets/account-menu/` (`GuestPreferencesCard` changelog row optional; board URL exported).
- `apps/web/public/locales/{en,de,es,fr}/landing.json` and new `privacy.json`; `shared/config/i18n/i18next.d.ts`.
- `apps/web/index.html`; `apps/web/datamine/sprites.txt` and `public/game_catalog/datamines/{ui,atlases}/` (8 new files).
- No companion `tacticus-planner-api` change.
