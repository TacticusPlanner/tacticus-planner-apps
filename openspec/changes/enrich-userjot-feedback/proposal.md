## Why

Feedback reaches UserJot with no context. Players type their device, page and build by hand. Replies to their posts go unnoticed, and the widget's richer entry points go unused: the submit form, single changelog posts and requests, and the in-widget roadmap. All of these are already in the v3 SDK we load.

## What Changes

- **Context on every post.** The widget is initialised with `pageContext: "path"`, so posts record the page they came from. Each identity-token request sends the app version, installed app or browser, and UI language, which the API signs into the token's traits.
- **Reply notices.** `whispers: true` lets a team reply or vote on the user's own post pop up a short notice. Changelog updates still never pop up (`notifications.updates: "none"`) and keep the unread dot.
- **Report a bug.** A new search quick action and a button on the fallback error page open the widget directly on its submit form.
- **Deep links.** `?changelog=<id>` and `?feedback=<id>` open that changelog post or request in the widget, then drop the parameter from the URL. Announcements can link into the signed-in widget.
- **Roadmap in the widget.** Inside the app shell, the account and guest menus' Roadmap row opens the widget's Roadmap. While the widget is unavailable, and on public pages, it stays a link to the public board.
- The privacy page's feedback section names the context sent.

Companion API change: `enrich-userjot-feedback` in `tacticus-planner-api`. It applies first and adds the optional query parameters and the `traits` claim.

## Capabilities

### Modified Capabilities

- `userjot-widget`: page context, token context, reply notices, Report a bug, deep links, in-widget roadmap.
- `account-menu`: the Roadmap row opens the widget's Roadmap, with the public board as fallback.
- `app-navigation`: Report a bug joins the quick actions after Submit Feedback.
- `app-error-recovery`: the fallback page offers Report a bug.

## Impact

- `app/providers/userjot-provider.tsx` and the new `userjot-targets.ts`.
- `entities/account` token query, `app/layout` quick actions and the mobile header, `app/routes/route-error-boundary.tsx`, and `widgets/account-menu` cards.
- `widgets/app-install` now exports `isRunningInstalled`.
- Locales: en/de/es/fr `common.json` (Report a bug strings, error-page hint) and `privacy.json` (feedback section).
- OpenAPI pin moves to the API PR's head: three optional query parameters on `GET /api/v1/userjot-token`.
