# Tasks

## 1. Pre-flight

- [x] 1.1 Compare every MODIFIED block under `specs/` with its current requirement in `openspec/specs/`. The only differences allowed are the ones `audit.md` calls for. Refresh any block whose main requirement changed after this change was written. Verify by listing the differences per block and matching each one to an audit id.
- [x] 1.2 For each of the 5 REMOVED requirements (D13, D28, D46, D47, D54), grep the canonical requirement named in its **Migration** for the removed requirement's key terms. Confirm the behavior is still stated there. Verify with a removed → canonical checklist that has no gaps.

## 2. Direct edits to main specs

- [x] 2.1 Apply every entry in `direct-edits.md`. Remove or rename each listed scenario in `openspec/specs/<capability>/spec.md`, and make the same edit in the matching MODIFIED block under `specs/` when one exists. Verify with an exact whole-line match (`grep -rnx "#### Scenario: <title>"`), checked within the named requirement, that each listed title is gone (or renamed) in both places, and that every edited requirement still has at least one scenario.
- [x] 2.2 Replace the three `TBD - created by archiving change …` Purposes (`datamine-source`, `goal-season-fit`, `v1-profile-import`) with the replacement text in audit L1–L3. Verify that `grep -rn "TBD" openspec/specs` returns nothing.
- [x] 2.3 Rewrite the six stale Purposes (`account-menu`, `home-projects-widget`, `home-raids-widget`, `goals-navigation`, `daily-shop-recommendations`, `goal-status-actions`) as given in audit L4a–L4f. Also apply the `app-navigation` Purpose rewording (L5i). Verify that "Current plan", "Active project", "out of scope", "existing full-tree" and the follow-up issue link no longer appear in those Purposes.
- [x] 2.4 Run `openspec validate compact-main-specs --strict` and `openspec validate --specs --strict` from `tacticus-planner-apps`. Verify that both pass. Report any description-length warnings on untouched text without fixing them here.

## 3. Archive dry check

- [x] 3.1 Commit the section 2 edits first, then in a throwaway `git worktree` of that commit, run `openspec archive compact-main-specs -y` and diff against `main`. Verify all of the following:
  - The only spec files touched are those listed in proposal.md.
  - No `## ADDED/MODIFIED/REMOVED` headers are left in `openspec/specs/`.
  - The requirement count drops from 960 by exactly the 5 REMOVED, checked with `grep -rh '^### Requirement:' openspec/specs | wc -l`.

  Then discard the worktree.

## Workflow follow-up

- Open one PR with the change folder and the direct main-spec edits. Archive in that PR once it is approved, so the copied MODIFIED blocks cannot go stale.
- File separate work items for the contradictions X1–X21 in `audit.md`, the 15 entries in `skipped.md`, and the optional shared progress-editor capability (D1).
