## Why

Three reports about the UserJot feedback widget's navigation and default
UI, all confirmed as real gaps by reading the actual integration code and
UserJot's own SDK/`init()` reference (`META-01`/`META-02` are tester
reports — the original issue notes guessed the vendor was "Canny"; it's
UserJot, already integrated in this repo. `META-03` is a direct
observation from a staging screenshot during this session):

- `META-01`: the widget is deliberately embedded in-app only — the
  original `add-userjot-widget` design explicitly treated SSO to
  UserJot's standalone public board as out of scope. But nothing else in
  the app links to the public board either, so a tester who didn't read
  the specific announcement mentioning it has no way to find it.
- `META-02`: `UserJotFeedbackButton`'s click handler calls `uj.open()`
  with no target, every time, regardless of why the unread indicator is
  showing — so clicking it always lands on the widget's default view, not
  wherever the unread activity actually is. UserJot's SDK reference
  confirms `open()` accepts `{ to: "notifications" }` as a real target,
  which this integration has never used.
- `META-03`: on the unauthenticated landing page, a UserJot "Welcome to
  Tacticus Planner Updates" popup appears in the bottom-right corner
  unprompted, while the app's own custom entry point (top-right, after
  sign-in) never appears there at all — `UserJotProvider` only mounts
  inside the authenticated `AppShell`. `apps/web/index.html`'s `uj.init()`
  call only sets `widget: { launcher: false }`, which per UserJot's own
  `init()` reference disables just the floating launcher _button_ — not
  `widget.whispers` (ephemeral toasts, default on) or
  `widget.notifications.updates` (auto-shown changelog announcements,
  default `'whisper'`). One of those two is what's surfacing. The original
  integration's own stated goal was to replace _all_ of UserJot's default
  UI with a custom launcher, not just the button — this is that goal not
  fully met, not a new decision.

## What Changes

- Add a plain external link to the public board (`https://tacticusplanner.userjot.com`
  — this project's own UserJot board root, already used for every UserJot
  post link elsewhere in this project's docs) next to each existing
  feedback entry point: a small icon button beside `UserJotFeedbackButton`
  in the desktop header, and a row beside the "Feedback" row in the mobile
  account drawer. Opens in a new tab; no SSO/identity involved (browsing
  the public board needs none), so this doesn't touch the identify flow at
  all.
- `UserJotFeedbackButton`'s click handler keeps opening the widget's
  default view unconditionally, unchanged from before this proposal.
  Routing to `{ to: "notifications" }` when unread activity was present
  was implemented and live-verified during this change, then reverted:
  UserJot's own `unread` count combines conversation replies, changelog
  posts, and feedback notifications into one number with no per-type
  breakdown, so a fixed "notifications" target is wrong whenever the
  source was actually a changelog post — confirmed live (a genuinely
  unread account showed an empty "You're all caught up" notifications
  view). See `design.md`'s Decisions and Risks sections for the full
  finding. The unread indicator itself is unaffected and still shows.
- Add `whispers: false` and `notifications: { updates: 'none' }` to
  `index.html`'s `uj.init()` call, alongside the existing
  `launcher: false`, so no UserJot UI ever appears without an explicit
  `uj.open()` call from this app's own code — on any page, in any auth
  state.
- No change to identify/theme/locale sync, to the mobile drawer's existing
  Feedback button behavior (it has no unread indicator today — only the
  desktop button does, per the existing "Desktop entry point" requirement
  — so `META-02` is desktop-only), to the explicit non-goal of never
  exposing UserJot Conversations, or to whether unauthenticated users get
  a feedback entry point at all (`META-03` removes a stray default one;
  it doesn't add a replacement — that's a separate product question, out
  of scope here).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `userjot-widget`: adds a full-board link at both entry points, and fully
  suppresses UserJot's default proactive UI (launcher, whispers,
  auto-shown announcements) on every page and auth state — not just the
  launcher button. The desktop button's click target was investigated for
  unread-aware routing and found not reliably achievable with the current
  SDK (see `design.md`); it keeps opening the default view, unchanged.

## Impact

- `apps/web/index.html` — `uj.init()` call gains `widget.whispers: false`
  and `widget.notifications.updates: 'none'`.
- `apps/web/src/fsd/app/providers/userjot-provider.tsx` — new exported
  `USERJOT_BOARD_URL` constant. `UserJotOpenTarget`'s `to` union is
  unchanged (the `"notifications"` addition was reverted with the routing
  decision above).
- `apps/web/src/fsd/app/providers/userjot-feedback-button.tsx` — click
  handler unchanged (see Decisions/Risks in `design.md` for why).
- New file: `apps/web/src/fsd/app/providers/userjot-board-link.tsx` (+
  test) — the new "view full board" link, shared by both entry points.
- `apps/web/src/fsd/app/layout/desktop-layout.tsx` — renders
  `UserJotBoardLink` beside `UserJotFeedbackButton` in the header controls
  row.
- `apps/web/src/fsd/app/providers/auth-control.tsx` — renders
  `UserJotBoardLink` beside the mobile drawer's "Feedback" row.
- New i18n key `feedback.viewBoard` in all four locales (en/de/es/fr).
- No API changes, no cross-repo companion change.
