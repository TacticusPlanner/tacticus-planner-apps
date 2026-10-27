# Design

## Context

See proposal.md (Why). The full audit lives in `audit.md` next to this file. For every finding it gives the file:line, the verbatim requirement header, a confidence level, and the exact old→new text. The deltas under `specs/` are that audit, written as OpenSpec operations. This design covers only the rules used to turn the audit into deltas, and what was left out.

No FSD slice, page, tour, i18n namespace or desktop/mobile split changes. The companion change is `compact-main-specs` in `tacticus-planner-api`. The two changes share no contract surface.

## Goals / Non-Goals

**Goals:**

- State each normative rule once. Other specs point to its owner (`see <capability>`).
- Main specs describe steady-state behavior, with no trace of the change that introduced it.

**Non-Goals:**

- Resolving contradictions. Where two texts disagree (X1–X21: header layout, onboarding fail-open vs retry, LE section orders and worked-example percentages, target-collision rules, icon paths, and others), both stay. A D or L entry that would silently pick a side is skipped. Each contradiction needs its own change with a behavior decision.
- New capabilities (D1), **(low)**-confidence entries, glossary alias removal (L13–L15), and the live HRE migration requirement (L11).
- Splitting requirements over 500 characters. MODIFIED blocks keep their existing text apart from the audited cuts.

## Decisions

**Scope rule: no meaning change.** An entry is in scope only if, after removal, every behavior is still specified, and the canonical copy is at least as specific as the removed one. If a "duplicate" carries a unique clause, the clause moves into the canonical copy only when it fits there verbatim. Otherwise the entry is skipped and the skip is noted in tasks. _Alternative:_ fix contradictions in the same pass. Rejected, because then a reviewer could no longer approve this as "deletions and rewording only".

**OpenSpec operation per finding type:**

- A whole duplicated or patch-only requirement becomes `REMOVED`. **Reason** names the audit id. **Migration** names the canonical capability and requirement.
- A sentence cut or a reworded leftover becomes `MODIFIED`, including wording inside a scenario. The full block is copied from the current main spec and only the audited text changes. When several findings hit one requirement, they merge into one block.
- Pointers to removed requirements in other specs are re-pointed in the same change.

**Scenario drops and renames are direct edits made before archive.** OpenSpec 1.15 rejects a MODIFIED block that leaves out a scenario the main spec still has, and it cannot remove a single scenario, so every MODIFIED block keeps all of its current scenarios. The 49 audited drops and renames are listed in `direct-edits.md` by capability, requirement and scenario. Seven capabilities change only this way and have no delta file. During apply, each one is edited in the main spec and in the matching MODIFIED block, so the two agree and archive applies cleanly. _Alternative:_ REMOVED plus ADDED of the whole requirement. Rejected because OpenSpec refuses the same header in both sections, and it would hide the real diff.

**Skipped entries are recorded.** `skipped.md` lists the 15 audit entries left out and why. Most would settle a contradiction (X5–X8, X17, X18, X21) or have a canonical copy that is less specific than the duplicate. A reviewer can promote any of them into a follow-up change.

**Desktop/mobile scenarios are kept.** Platform-split scenarios with the same title on different pages are page-specific by the project's spec rules, not duplicates. Only scenarios that assert the same rule on the same surface are dropped.

**Purpose edits are made directly in `openspec/specs/`.** Deltas ignore `## Purpose`. The audit's proposed Purpose text for the three `TBD` and six stale Purposes is applied as a task in the same PR as the archive.

## Risks / Trade-offs

- [A MODIFIED block copied from a spec that changes before archive silently reverts that change] → Archive soon after approval. A task re-diffs every MODIFIED block against the current main spec right before archive.
- [Removing a "duplicate" that carried a unique clause] → Every REMOVED entry names its canonical copy. The apply step greps each removed requirement's key terms in the canonical spec before archive.
- [The audit was split across four reviewers, so an overlap could be read twice with different actions] → Entries hitting the same requirement are merged into one MODIFIED block. Where two actions conflict, the narrower cut wins.

## Review adjustments

Changes made after the CodeRabbit review on PR #336. Each one is either a fix to this change, or a one-line clarification of copied text, checked against the code:

- `dailies-navigation` "Dailies has a Quest tab" keeps "Direct navigation", because dropping both of its scenarios would have left it with none.
- Two leftover requirement names are RENAMED: `api-contract-sync` "Failure handling is unchanged" becomes "Failed responses surface as typed API errors", and `goals-navigation` "Planning Settings is a Goals-only control" becomes "Planning Settings appears on Goals, not on Projects or Insights". `current`/`errors` are read only when the problem body carries them.
- Clarifications that match the code:
  - A locked character's power is 0 even without power data (`rosterCharacterPower`).
  - Capped tokens use `current >= max` (`tokenCountdown`).
  - Quest calibration counts only usable samples, those with B > 0 (`calibrateQuestPowerRatio`).
  - The four-action project menu excludes the Default project.
  - The collapsed-menu header keeps its reopen button and breadcrumb.
- `tasks.md` now matches scenario titles exactly, and commits the direct edits before the archive dry run.
- Two comments describe contradictions already recorded in `audit.md`, and are left for a behavior change: X1 (public-board link placement) and X16 (target-collision uniqueness).
