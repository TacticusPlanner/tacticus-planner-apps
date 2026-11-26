## Why

"Send feedback" in the account menu and "Submit feedback" in search open the widget's Home, so a player who wants to post feedback first has to find the Feedback tab. The entry point already says what the player wants to do.

## What Changes

- The account menu's Send feedback row (desktop and mobile) and the Submit feedback search quick action open the widget on its Feedback list (`open({ to: "feedback" })`) instead of Home.
- The desktop feedback button in the global bar is unchanged: it opens Home, or Updates while there is unread activity.

## Capabilities

### Modified Capabilities

- `userjot-widget`: Send feedback entry points open the Feedback list.

## Impact

- `app/providers/auth-control.tsx` (Send feedback row) and `app/layout/use-quick-actions.ts` (Submit feedback action), with their tests.
- No API or locale change.
