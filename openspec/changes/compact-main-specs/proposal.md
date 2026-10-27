# Proposal

## Why

The 133 main specs (960 requirements, about 24k lines) have built up duplication as changes were archived:

- The same rule is restated across goal, Legendary Event, Dailies and Home specs.
- Scenarios are pasted under several requirements.
- A lot of text only made sense inside the delta that introduced it: three `TBD - created by archiving change …` Purposes, "before this change" wording, change names cited as if they were capabilities, "This supersedes …" patches, and scenarios about views that have since been merged.

So a reader can't tell which copy is canonical, and every new change has to find and edit each copy. The companion change, `compact-main-specs` in `tacticus-planner-api`, cleans up the backend specs the same way. The two halves are independent.

## What Changes

This change edits spec text only. No UI, route, i18n, tour or behavior changes. Each item traces to an audit id in `audit.md`: D = specified twice, S = repeated scenario, L = archive leftover.

- **Remove requirements specified twice (D2–D62, high-confidence entries).** Keep the canonical copy and replace each restatement with nothing or a one-line `see <capability>` pointer. The main clusters:
  - Dailies tabs: `dailies-navigation` plus four "supersedes" patches become one statement.
  - Goals and projects:
    - `goal-project-membership` vs `project-management`
    - `goal-edit-dialog` vs `goal-target-editing` vs `goal-creation`
    - five restatements of "a project view is a projection of the one global run"
  - Legendary Events: run resolution, plan writes, tour order, token/marks rules.
  - Home widgets.
  - Event-points-vs-Today copies.
  - Account and shell copies.
  - `raid-boss-library` internal duplicates.
  - `api-contract-sync` "Failure handling is unchanged".
- **Drop pasted scenarios (S1–S16).** These are the real copies only. Same-title scenarios that assert different things ("Desktop layout", "Loading", "Signed out", worked examples) stay.
- **Remove archive leftovers (L1–L10, L16, L17).**
  - Reword about 51 "this change / as today / previously / supersedes" sentences into steady-state text.
  - Point the four change names cited as capabilities, and the two dangling requirement pointers, at the real owners.
  - Drop scenarios about removed UI, or about two views that are now one page.
- **Rewrite Purposes by direct edit** (deltas cannot change Purpose): the three `TBD` placeholders (`datamine-source`, `goal-season-fit`, `v1-profile-import`) and six stale Purposes (`account-menu`, `home-projects-widget`, `home-raids-widget`, `goals-navigation`, `daily-shop-recommendations`, `goal-status-actions`).

Out of scope, kept as-is:

- Contradictions X1–X21 in `audit.md`, and any D/L entry that would settle one. Choosing which copy is right changes behavior.
- D1: extracting a shared "progress editor draft" capability for the three identical requirements in `campaign-event-progress-editing` and `onslaught-progress-entry`. It needs a new capability.
- Entries the audit marks **(low)**.
- The `hre-mission-tracker` local-storage migration requirement (L11), while its code exists.
- The "Overview", "Project Detail" and "Raids Plan" glossary aliases (L13–L15).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

Each capability below has a delta file. Scenario drops and renames cannot be expressed in a delta, so they are listed in `direct-edits.md` and applied by hand during apply.

- `account-display-name`: drop the restated feedback-identity refresh and loading identity, pointing to `userjot-widget` and `account-menu` (D8, D9, D10)
- `account-menu`: drop the duplicated sidebar-trigger sentence, the "out of scope for this change" paragraph and "remain unchanged" wording (D3, L5b–e)
- `api-contract-sync`: drop "exactly as before the change" from the failure-handling scenario (L5l)
- `app-navigation`: drop the repeated Dailies live-indicator rule and the "supersedes", "unchanged" and "this capability" wording (D4, D5, L5f–k)
- `character-combat-power`: drop the "single power figure" rule, which `unit-power` owns (D14)
- `dailies-guild-raid-status`: drop the "in this change" wording (L5n–o)
- `dailies-navigation`: state the five Dailies tabs once and remove four "supersedes" patches and their repeated Tab order and Direct navigation scenarios (D26, S2)
- `daily-raids-filters`: drop the Home-widget and HSE restatements; fix the dangling "Enemy traits" pointer (D33, D34, L10)
- `daily-raids-home-screen-event`: drop the event-points and running-wins restatements (D30, D31)
- `daily-raids-plan`: point to the HSE spec for event-agnostic scheduling; drop the restated project narrowing and the "formerly / unchanged by the move" wording (D30, D36, L5av)
- `daily-raids-today`: point to the HSE spec and "Today's schedule scope"; fix the dangling "Today's raid schedule" pointer (D30, D36, L10, S6)
- `daily-shop-recommendations`: point to the Shops scope requirement instead of restating it (D38)
- `equipment-item-icons`: drop the "This change SHALL close these gaps" table (L5p)
- `game-shops-catalog`, `raid-boss-catalog`: reword "after this change" in the upgrade scenarios (L5q, L5r)
- `goal-acquisition-source-picker`: reword "before this control existed" (L5aa, L5ab)
- `goal-creation`: drop the scenarios duplicated in other goal specs, point to the API rule instead of an archived change name, and reword "Project Detail" and "as today" (D56, D59, L9, L17, L5ah, S13)
- `goal-creation-entry-points`: replace the reference to the `remember-consecutive-goal-context` change (L8)
- `goal-edit-dialog`: drop restatements of `goal-mythic-material-sources`, `goal-target-editing` and its own read-only rule; reword "Overview / Project Detail" (D55, L17, L5s, S14)
- `goal-farming-estimates`: reword four "before this change" or "unchanged" phrases (L5t–x)
- `goal-mythic-material-sources`: reword "goals created before this change" (L5y–z)
- `goal-progress-display`: drop the removed goal-detail-sheet scenario and reword "previously", "no longer" and "unchanged" (L16, L5aj–al, S16)
- `goal-project-membership`: REMOVED the superseded membership-filter requirement; drop restated row-menu rules (D46, D51, L5am)
- `goal-season-fit`: drop "as today" (L5ai)
- `goal-visual-accessibility`: point to `goal-list-layout` instead of an archived change name (L6)
- `goals-navigation`: point to `planning-settings-access` and `global-goal-priority`; replace an archived change name and "as before this change" (D53, D54, L7, L5ad)
- `home-raids-widget`: place Daily Raids by pointing to `home-projects-widget` (D29)
- `home-token-availability`: REMOVED the shared-row requirement in favour of `home-events-widget`, re-point its citation, and replace the implementation note (D28, L5au, S9)
- `hre-mission-teams`: point to the Onslaught pool rule (D40)
- `hre-mission-tracker`: reword the "Entry stored before this change" scenario (L5ag)
- `hse-points-projection`: drop "past instances not projected", which "The projection handles its states" already says (D32)
- `legendary-event-eligibility`: drop restated leaderboard-control persistence (D24)
- `legendary-event-goals-preview`, `legendary-event-upgrade-impact`: define the Unlock base state once (D23)
- `legendary-event-plan-wizard`, `legendary-event-team-editor-workflow`, `legendary-event-teams`: drop "as today" and "previously" wording; drop the restated cleared-objective marking (D22, L5ap–ar)
- `legendary-event-run-inputs`, `legendary-event-synced-progress`, `legendary-event-token-plan`: point to the plan write queue and the marks and token-plan owners (D18, D19, D20)
- `legendary-event-run-resolution`: point the unknown-run clauses to their owners (D17)
- `legendary-events-hub`: point the objective icons to `legendary-event-synced-progress`; drop "unchanged from its requirement" (D16, L5as)
- `mow-unit-details`: point the missing-text state to the character page (D13b)
- `project-management`: REMOVED the duplicated row-removal and goal-order requirements; drop the "Archive unavailable for Default" copies; reword "no longer" and "Current plan" (D47–D50, D54, L5an–ao, S7)
- `quest-event-clear-estimates`: untangle the calibration sentence and drop "in this change" (L5ae)
- `userjot-widget`: point the search hand-off to `app-navigation`; drop "as today" (D7, L5at)
- `v1-profile-import`: REMOVED "Each selected part's outcome is reported" and fold its positive half into "An unselected part occupies no row in the result" (D13)

Changed only by direct scenario drops (no delta file; see `direct-edits.md`): `ability-rules-text` (L5af), `character-unit-details` (D13c), `goal-deletion` (L17), `goal-status-actions` (D52), `goal-target-editing` (D55), `npc-library` (D43), `raid-boss-library` (D27).

## Impact

- Only `openspec/specs/**` changes, applied through archive plus direct Purpose edits. No code, locale, tour or test change.
- Removes 5 requirements and 49 scenarios, trims 88 requirements, and stops the duplicated rules from drifting apart. Entries left out are listed with their reasons in `skipped.md`.
- MODIFIED blocks are copies of the current main specs, so this change should be archived soon after approval, before other changes touch the same requirements.
