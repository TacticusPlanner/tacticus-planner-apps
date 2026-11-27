## Why

A project with a target always measured its goals against its own deadline. The Season fit select was swapped for a read-only "Using project deadline" chip, so there was no way to turn the deadline view off or look at a season instead while in that project.

## What Changes

- In a project scope with a target, the Season fit select stays and gains a first option, **Project deadline**, chosen by default.
- Picking Off, Battle Pass, Guild Raid or Guild War there hides the deadline header, labels and dividers and applies that choice instead.
- The targeted choice is stored per browser apart from the unscoped Season fit choice, so neither changes the other.
- The read-only "Using project deadline" chip is removed.
- The Goals tour always shows the Season fit step, then the deadline step when the deadline is chosen.

## Capabilities

### Modified Capabilities

- `goal-season-fit`: the select offers Project deadline in a targeted scope instead of being replaced.

## Impact

- `pages/goals/ui/goals-board/` (`goals-page.tsx`, `season-fit-select.tsx`, new `targeted-fit-choice.ts`, `deadline-fit-header.tsx`, the tour) and their tests.
- `goals.seasonFit.options.projectDeadline` added and `goals.deadlineFit.overrideChip` removed in en/de/es/fr. No API change.
