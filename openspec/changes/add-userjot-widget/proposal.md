## Why

Neither the desktop nor mobile app gives users an in-app way to send feedback, see the roadmap, or read changelog updates — GitHub issue [#45](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/45) tracks adopting UserJot for this. Feedback today has no home in the product at all; adding it as a widget keeps it next to the work instead of sending users to a separate site.

## What Changes

- Install the UserJot v3 widget SDK and initialize it with the workspace's project ID.
- Add a custom launcher (`launcher: false` in `init`) instead of UserJot's default floating button:
  - Desktop: an icon button in the section header's icon row, alongside the theme and language switchers, showing an unread badge.
  - Mobile: a "Feedback" row inside the existing account drawer (the same menu that already lists theme, language, and account actions).
- Identify signed-in users to the widget using a **signed** identity: fetch a short-lived JWT from a new `tacticus-planner-api` endpoint (see the companion `add-userjot-widget` change in that repo) and pass it to the widget SDK's `identify()`. Clear identification (`logout()`) when the user signs out.
- Enable the widget's Feedback, Roadmap, and Updates (changelog) surfaces. Conversations (live chat) is explicitly **out of scope** for this change.
- Sync the widget's theme and locale to the app's own theme switcher and active UI language instead of leaving them on `'auto'`.

## Capabilities

### New Capabilities

- `userjot-widget`: the in-app UserJot widget — its desktop/mobile entry points, identified-user session lifecycle, and theme/locale sync.

### Modified Capabilities

(none — the desktop account menu (`account-menu`) and its popover are unaffected; the mobile account drawer gains a new row but has no existing capability governing its contents)

## Impact

- New provider(s) under `apps/web/src/fsd/app/providers/` (widget init, identify/logout lifecycle, theme/locale sync) and a shared hook consumed by both the desktop header button and the mobile drawer row.
- Changes to `apps/web/src/fsd/app/layout/desktop-layout.tsx` (new header icon button) and `apps/web/src/fsd/app/providers/auth-control.tsx` (new mobile drawer row).
- New client-side config for the UserJot project ID (public, safe to ship to the browser — only the project _secret_ stays server-side in `tacticus-planner-api`).
- Depends on the companion `tacticus-planner-api` change `add-userjot-widget` (new signed-token endpoint), which applies first.
