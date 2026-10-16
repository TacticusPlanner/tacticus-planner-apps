# Proposal

## Why

Stage 6 of the V2 Legendary Event plan ("Goals integration and recommendations", docs plan §5) answers three survey items the earlier stages leave open: Goals Preview (37% of respondents, "choosing upgrades for LRE"), pain #5 ("want recommendations": suggested teams, upgrade impact like "Wrask D1→D3 = +120 points") and pain #8 ("goal status not visible from teams"). Stages 2 and 5 are done, so every input exists: teams and depths per run, the per-unit and per-team clear estimates, the lane points model and synced progress. The Stage 1 follow-up also left the leaderboard card's three-dots menu with Create goal for this stage.

Upgrade impact counts points from the battles a team newly reaches, using the lane points model and the Stage 5 depth estimate. It does not read Stage 4's token plan (`add-legendary-event-token-plan`, not implemented yet), so this change does not depend on Stage 4. That was the product owner's choice on 2026-10-15.

## What Changes

- **Goals Preview** toggle on the leaderboards (lane and Overview) and in the team picker. While on, each unit with an active goal is evaluated at its goal targets (Unlock, Ascension, Rank, Ability): its owned state, rarity, rank and estimated clears follow the targets, with a "preview" marker. Points do not change, because objective matching reads only static unit data.
- **Goal badge** on unit tiles (leaderboard rows, picker tiles, upgrade impact rows, suggestion members) when the unit has an active goal, listing its goals.
- **Lane reachable points**: the points a lane's teams can still earn within their depths. Per battle a team reaches, it counts the kill score left, defeat-all if not cleared, and each uncleared objective some reaching team covers. This is the shared measure for upgrade impact and suggestions.
- **Upgrade impact** section on each lane tab. It lists each team member's next step (unlock, next rank within the rarity cap, next ascension step) that lifts a team's estimated depth and adds lane reachable points: "+148 points, Four reaches battle 6". Each row has Create goal, prefilled for that step.
- **Leaderboard row actions menu** (lane and Overview, both forms) whose first item is **Create goal**: Unlock for a locked unit, otherwise the unit preselected.
- **Suggest teams** on each lane's Teams section. It ports V1 `suggestTeams` as a pure lib with V1's recommend-first/last bias replaced by "Prefer units with goals" and "Only unlocked" toggles. Proposals cover one or two of the lane's objectives, are ranked by the lane reachable points they add over existing teams, and explain themselves in one line. **Use this team** opens the team editor prefilled. Nothing is saved until the user saves.
- **Goal creation from other pages**: the Create Goal launcher context and prefill type move from `pages/goals` to `entities/goal`, so the Legendary Event page can launch the shell's creation sheet. The prefill gains a Rank target and a unit-only variant.
- **Tour, analytics and i18n**: an Upgrade impact tour step and updated Teams and leaderboard step copy; preview, create-goal and suggestion analytics; all copy in en/de/es/fr.

Out of scope: Stage 4's token plan and Next token card, the cross-event master table and history (Stage 7), sharing (Stage 8), ability-level and upgrade-material steps in upgrade impact, and goal cost (time or resources) in the ranking.

## Capabilities

### New Capabilities

- `legendary-event-goals-preview`: the preview toggle, how goal targets map onto a previewed unit, the goal badge, and their data states.
- `legendary-event-upgrade-impact`: lane reachable points, next steps per team member, the impact calculation with worked examples, the section, its Create goal action, and its tour step.
- `legendary-event-team-suggestions`: the suggestion calculation with a worked example, the toggles, the dialog and sheet, and accepting a proposal into the team editor.

### Modified Capabilities

- `legendary-event-eligibility`: leaderboard rows gain an actions menu with Create goal.
- `goal-creation-entry-points`: the Legendary Event page launches goal creation with the unit, and for upgrade impact the goal type and target, prefilled.

## Impact

- No companion API change. Goals (`GET /me/goals`, `GET /me/goals/{id}`), plans, the roster, `lre-battles` and `horde-mode-tiers` are already served.
- `apps/web/src/fsd/entities/goal/` (launcher context and prefill type moved in, `ui/unit-goal-badge.tsx`), `pages/goals/` (imports updated, Rank and unit-only prefill handling), `app/layout/app-shell.tsx`.
- `entities/legendary-event/` (`lib/goal-preview-roster.ts`, `lib/reachable-points.ts`, `lib/upgrade-steps.ts`, `lib/upgrade-impact.ts`, `lib/team-suggestions.ts`), new `features/legendary-event-goals/`, new `features/legendary-event-team-suggestions/`, `features/legendary-event-teams/` (picker preview and badge, editor opened from a proposal, `source` on the created-team event), `pages/legendary-events/ui/legendary-event/` (leaderboard menu, preview and badge; upgrade impact section; Suggest teams; page view model; tour), locales `legendaryEvents.json` in four languages.
- Overlaps with `add-legendary-event-token-plan` (apps PR #219) in `legendaryEvents.json`, `legendary-event-page.view-model.ts` and `legendary-event.tutorial.tsx`. The tour order requirement in `legendary-events-hub` is changed only by #219; this change adds its step through its own capability, so whichever change lands second reconciles the tour order in code only. The two stages share no calculation.
