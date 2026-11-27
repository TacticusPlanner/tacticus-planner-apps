## REMOVED Requirements

### Requirement: Project-aware browsing defaults to all goals

**Reason**: Superseded by "Project-aware pages share one remembered project selection" and "A remembered project falls back to all goals" below. The selection is now shared by every project-scoped page and kept across reloads instead of reset per page and per session.

**Migration**: None. Nothing was stored before, so every player starts on "All goals".

## ADDED Requirements

### Requirement: Project-aware pages share one remembered project selection

Insights, Schedule and every Dailies page that offers the project selector (Raids, HSE, HRE, Event shop) SHALL share one project selection, defaulting to "All goals". Choosing or clearing a project on one of them SHALL apply on all. The choice SHALL be kept per browser across reloads, as account data that sign-out removes, and SHALL NOT follow the Goals page's project scope. No project SHALL be pre-selected for its type or status, including Default.

#### Scenario: Insights opens on all goals

- **GIVEN** the account has a Default project and other projects
- **WHEN** the user opens Insights with no project chosen before
- **THEN** Insights shows all goals with "All goals" selected in its project selector

#### Scenario: A project picked on Dailies is selected on Insights

- **GIVEN** the user selected project B on Dailies > Raids
- **WHEN** they open Insights
- **THEN** Insights shows project B selected

#### Scenario: Browsing a project does not set the filter

- **GIVEN** the user opens `/plan/goals?project={B}`
- **WHEN** they later open Insights with no project chosen before
- **THEN** Insights shows "All goals", not project B

#### Scenario: Reload keeps the selection

- **GIVEN** the user selected project B on Shops
- **WHEN** they reload the page and open Shops
- **THEN** Shops shows project B selected

### Requirement: A remembered project falls back to all goals

A remembered project that the loaded project list no longer has, or that is archived, SHALL apply as "All goals". While the list loads the remembered project SHALL apply; when the list fails to load, "All goals" SHALL apply and the remembered project SHALL be kept for a later load. When storage is unavailable the choice SHALL still apply for the visit (see `browser-storage-resilience`).

#### Scenario: A deleted project falls back to all goals

- **GIVEN** the user selected project B, and project B has since been deleted
- **WHEN** they open Insights
- **THEN** Insights shows "All goals"

#### Scenario: An archived project falls back to all goals

- **GIVEN** the user selected project B, and project B has since been archived
- **WHEN** they open Dailies > Raids
- **THEN** Today shows "All goals"
