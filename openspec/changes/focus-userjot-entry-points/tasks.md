## 1. Entry points

- [x] 1.1 Send feedback in the account menu (desktop and mobile) opens `open({ to: "feedback" })`
- [x] 1.2 The Submit feedback quick action opens `open({ to: "feedback" })`

- [x] 1.3 Changelog entry points open the newest post while there is unread activity, read from the widget's updates feed with a fallback to the list
- [x] 1.4 Remember the last post opened this way so a lingering dot opens the list

## 2. Tests

- [x] 2.1 Account menu and quick action tests assert the Feedback target
- [x] 2.2 Unit tests for the feed read, the target choice and the fallback; entry point tests call `openChangelog`
- [ ] 2.3 Manual check on staging: with an unread post, Changelog opens that post; a second click opens the list
