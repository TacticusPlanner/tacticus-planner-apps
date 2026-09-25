## Why

Goal and project views show progress and organization but often make users leave to discover what materials or nodes will advance a goal (`GUI-07`, `PLAN-007`). A project outside the currently selected plan also needs a useful preview without implying its raids are actionable today.

## What Changes

- Expose a concise, reachable resource-quantity breakdown, eligible farming locations, blockers, and next action from goal detail; surface a project-level summary or direct link to that guidance.
- Distinguish a plan preview from farming actionable now, including locked/unavailable nodes.
- For Level goals, show additional XP-book-equivalent need (in the user's chosen rarity, default Legendary) alongside raw XP, net of owned books allocated to higher-priority goals in the selected project.
- Add an XP-book rarity setting (Common–Mythic, default Legendary) to the Planning settings dialog, persisted with the existing user settings.

## Capabilities

### New Capabilities

- `goal-farming-guidance`: Actionable and preview farming guidance in goal/project views.

### Modified Capabilities

None; the existing raw-XP and estimate requirements remain.

## Impact

Apps goal detail/project detail and shared farming result presentation. Confirm whether the existing API/catalog exposes all necessary source data for farming guidance. Planning settings dialog (apps) and the `user-settings` contract (API): one new validated field, defaulting to Legendary for existing users, so a paired API change is required for the rarity setting.
