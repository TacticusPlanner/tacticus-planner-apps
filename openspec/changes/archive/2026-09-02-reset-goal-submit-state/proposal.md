## Why

After a successful goal creation that closes the side panel, its persisted
form state remains `submitting`. Reopening the panel therefore leaves the
submit button disabled until the user reloads the application, preventing
them from creating another goal.

## What Changes

- Reset the goal-creation form's transient submission state after a successful
  normal save before the sheet is closed.
- Preserve the existing "Create another" behavior, including its form reset
  and ready-to-submit state.
- Add regression coverage for closing the persistently mounted sheet after a
  successful save and reopening it with a usable submit action.

## Capabilities

### New Capabilities

- `goal-creation`: Creating combined goals from the goal-creation sheet,
  including reliable submission-state handling across consecutive uses.

### Modified Capabilities

<!-- None. -->

## Impact

- Affects the goal-creation form submission hook and its `CreateGoalSheet`
  component test coverage in `apps/web/src/fsd/pages/goals`.
- Does not change API contracts, persisted data, translations, or dependencies.
