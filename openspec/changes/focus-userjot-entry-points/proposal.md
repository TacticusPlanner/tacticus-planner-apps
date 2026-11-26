## Why

"Send feedback" in the account menu and "Submit feedback" in search open the widget's Home, so a player who wants to post feedback first has to find the Feedback tab. The entry point already says what the player wants to do. Likewise, the unread dot means a new changelog post, yet Changelog opens the Updates list rather than that post.

## What Changes

- The account menu's Send feedback row (desktop and mobile) and the Submit feedback search quick action open the widget on its Feedback list (`open({ to: "feedback" })`) instead of Home.
- While there is unread activity, the Changelog entry points (the desktop feedback button, the account menu's and guest menu's Changelog rows, and the mobile guest settings) open the newest changelog post directly. The post id comes from the public feed the widget loads its Updates tab from (`GET https://widget.userjot.com/widget/v2/:projectId/updates?limit=1`), because the SDK has no call that names it. The last post opened this way is remembered, so a dot that stays lit for another reason opens the list instead of the same post again. Without unread activity, or when the feed cannot be read, they open the Updates list as before.
- Without unread activity the desktop feedback button keeps opening Home.

## Capabilities

### Modified Capabilities

- `userjot-widget`: Send feedback entry points open the Feedback list; Changelog opens the newest unread post.

## Impact

- `app/providers/auth-control.tsx` (Send feedback row) and `app/layout/use-quick-actions.ts` (Submit feedback action), with their tests.
- `app/providers/userjot-latest-update.ts` (new: feed read, target choice, last-opened memory), `userjot-provider.tsx` (`openChangelog`), `userjot-feedback-button.tsx`, `layout/mobile-header.tsx`, with tests.
- The feed is an undocumented UserJot endpoint (CORS `*`, already allowed by `connect-src https://*.userjot.com`); any failure falls back to the list. No API or locale change.
