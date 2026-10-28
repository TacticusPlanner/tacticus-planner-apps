type ViewMode = "desktop" | "mobile"

/**
 * Route-level navigation, captured on route change while identified. Carries only the matched
 * route pattern (never the URL) plus its nav section and viewport form - see
 * specs/product-analytics/spec.md's "Navigation is reported as declared page-view events".
 */
type PageViewEvent = {
  type: "page_view"
  routePattern: string
  routeGroup: string
  viewMode: ViewMode
}

/**
 * A Legendary Event team was created, edited or deleted from the event page's Teams section.
 * Carries ids and counts only, never team names.
 */
type LegendaryEventTeamEvent = {
  type: "legendary_event_team_edited" | "legendary_event_team_deleted"
  eventId: string
  laneId: string
  memberCount: number
  objectiveCount: number
}

/** A team was created: from scratch (`manual`) or from a team suggestion, with its 1-based rank in
 *  the suggestions list (null for `manual`). */
type LegendaryEventTeamCreatedEvent = Omit<LegendaryEventTeamEvent, "type"> & {
  type: "legendary_event_team_created"
  source: "manual" | "suggestion"
  suggestionRank: number | null
}

/** Goals Preview was turned on or off on the leaderboard controls or in the team picker. */
type LegendaryEventGoalsPreviewToggledEvent = {
  type: "legendary_event_goals_preview_toggled"
  eventId: string
  enabled: boolean
  surface: "leaderboard" | "picker"
}

/** The goal-creation sheet was opened from a leaderboard row or an Upgrade impact row. */
type LegendaryEventCreateGoalOpenedEvent = {
  type: "legendary_event_create_goal_opened"
  eventId: string
  laneId: string | null
  source: "leaderboard" | "upgradeImpact"
  goalType: "Unlock" | "Ascension" | "Rank" | null
}

/** A lane's Upgrade impact section was expanded. */
type LegendaryEventUpgradeImpactExpandedEvent = {
  type: "legendary_event_upgrade_impact_expanded"
  eventId: string
  laneId: string
  /** null when the section had no rows to count (loading, no teams, no estimates). */
  rowCount: number | null
}

/** The Suggest teams dialog was opened on a lane. */
type LegendaryEventTeamSuggestionsOpenedEvent = {
  type: "legendary_event_team_suggestions_opened"
  eventId: string
  laneId: string
  suggestionCount: number
}

/** A team's clear depth for the current run was set by hand (null when cleared). `estimate` is
 *  the estimate shown at the time (null when none), `fromEstimate` whether the edit started from
 *  it: together the override log for tuning clear estimates. */
type LegendaryEventDepthSetEvent = {
  type: "legendary_event_depth_set"
  eventId: string
  laneId: string
  depth: number | null
  estimate: number | null
  fromEstimate: boolean
}

/** Use estimate was pressed: the manual depth was cleared so the estimate shows again. */
type LegendaryEventDepthEstimateRestoredEvent = {
  type: "legendary_event_depth_estimate_restored"
  eventId: string
  laneId: string
  estimate: number
}

/** One run's inputs (missions, premium missions, bundle, Oh So Close shards) were saved from the
 *  run inputs drawer; once per saved write. */
type LegendaryEventRunInputsSavedEvent = {
  type: "legendary_event_run_inputs_saved"
  eventId: string
  run: number
  regularMissions: number
  premiumMissions: number
  bundlePurchased: boolean
  closeShards: number
}

/** The 1-click plan wizard opened, from the Overview button, the Suggest teams link or a link. */
type LegendaryEventPlanWizardOpenedEvent = {
  type: "legendary_event_plan_wizard_opened"
  eventId: string
  source: "overview" | "suggestions" | "link"
}

/** A target step was chosen in the 1-click plan wizard, with its verdict at that moment. */
type LegendaryEventPlanTargetChosenEvent = {
  type: "legendary_event_plan_target_chosen"
  eventId: string
  step: string
  verdict: "reachableNow" | "needsUpgrades" | "tooAmbitious"
}

/** The 1-click plan wizard's Create finished (`ok` false when an item failed). */
type LegendaryEventPlanCreatedEvent = {
  type: "legendary_event_plan_created"
  eventId: string
  goals: number
  teams: number
  ok: boolean
}

/** The plan's Show paid options switch was turned on or off. */
type LegendaryEventPaidOptionsToggledEvent = {
  type: "legendary_event_paid_options_toggled"
  eventId: string
  on: boolean
}

/** A Maybe clear / Stop here mark was set (or cleared, status null) on one cell or a whole battle
 *  of the Synced progress grid, or on a planned token's cells from the Next token card. */
type LegendaryEventAnnotationSetEvent = {
  type: "legendary_event_annotation_set"
  eventId: string
  laneId: string
  battleIndex: number
  cellCount: number
  status: "maybeClear" | "stopHere" | null
  scope: "cell" | "battle" | "token"
}

/** The Next token card's state: a token, or which empty state it shows. */
type LegendaryEventNextTokenState =
  "token" | "noTeams" | "noDepth" | "nothingLeft" | "allCleared" | "unavailable"

/** The Next token card rendered (once per page view and state change). */
type LegendaryEventNextTokenShownEvent = {
  type: "legendary_event_next_token_shown"
  eventId: string
  state: LegendaryEventNextTokenState
  planLength: number
  tokensLeftOver: number
}

/** The Token plan section was expanded. */
type LegendaryEventTokenPlanExpandedEvent = {
  type: "legendary_event_token_plan_expanded"
  eventId: string
  planLength: number
}

/** The Run forecast section was expanded. */
type LegendaryEventRunForecastExpandedEvent = {
  type: "legendary_event_run_forecast_expanded"
  eventId: string
}

/** The Legendary Events master table was opened (once per visit) with its starting controls. */
type LegendaryEventMasterTableViewedEvent = {
  type: "legendary_event_master_table_viewed"
  eventCount: number
  unitSet: "all" | "unlocked" | "inTeams"
  pointsMode: "remaining" | "all" | "estimated"
}

/** A master table control changed: `value` is the new unit set, points mode or sort (an event id,
 *  or "total"); for the event picker `eventCount` carries the new selection size instead. */
type LegendaryEventMasterTableChangedEvent = {
  type: "legendary_event_master_table_changed"
  control: "events" | "unitSet" | "pointsMode" | "sort"
  value: string | null
  eventCount: number | null
}

/** The event page's Last run card first became visible (once per page view). */
type LegendaryEventLastRunViewedEvent = {
  type: "legendary_event_last_run_viewed"
  eventId: string
  run: number
  teamCount: number
  deltaCount: number
}

/** The Earlier runs list of an archived or upcoming event was opened. */
type LegendaryEventEarlierRunsExpandedEvent = {
  type: "legendary_event_earlier_runs_expanded"
  eventId: string
  recordCount: number
}

/** The horde-mode Tier List page was opened (once per visit). */
type LegendaryEventTierListViewedEvent = {
  type: "legendary_event_tier_list_viewed"
}

/** A Tier List tile's details opened; `tier` is the tier name or "untiered". */
type LegendaryEventTierListUnitOpenedEvent = {
  type: "legendary_event_tier_list_unit_opened"
  unitId: string
  tier: string
}

/** Where the install offer was opened from. */
type AppInstallSource = "homeCard" | "accountMenu"

/** How this browser installs the app (widgets/app-install's InstallPlatform). */
type AppInstallPlatform =
  "ios" | "macSafari" | "android" | "desktop" | "unsupported"

/** The install guide opened, from the Home card or the account menu. `canPrompt` is whether the
 *  browser offered its one-tap install prompt, rather than manual steps only. */
type AppInstallGuideOpenedEvent = {
  type: "app_install_guide_opened"
  source: AppInstallSource
  platform: AppInstallPlatform
  canPrompt: boolean
}

/** The browser's install prompt was answered. */
type AppInstallPromptAnsweredEvent = {
  type: "app_install_prompt_answered"
  source: AppInstallSource
  outcome: "accepted" | "dismissed"
}

/** The Home install card was dismissed with Not now. */
type AppInstallCardDismissedEvent = {
  type: "app_install_card_dismissed"
  platform: AppInstallPlatform
}

/** An error nothing else handled (spec: client-error-reporting). Message and stack have URL query
 *  strings removed; the route is reported as its nav section, never the URL. */
type ClientErrorEvent = {
  type: "client_error"
  message: string
  stack: string | null
  context: string | null
  routeGroup: string
  appVersion: string | null
}

/**
 * Every event the product may report to the analytics destination. A discriminated union rather
 * than a free-form property bag, so declaring a new event is a type change here rather than an
 * arbitrary payload at a call site - see tacticus-planner-docs/analytics/events-catalog.md.
 */
export type AnalyticsEvent =
  | PageViewEvent
  | LegendaryEventTeamEvent
  | LegendaryEventTeamCreatedEvent
  | LegendaryEventGoalsPreviewToggledEvent
  | LegendaryEventCreateGoalOpenedEvent
  | LegendaryEventUpgradeImpactExpandedEvent
  | LegendaryEventTeamSuggestionsOpenedEvent
  | LegendaryEventDepthSetEvent
  | LegendaryEventRunInputsSavedEvent
  | LegendaryEventPaidOptionsToggledEvent
  | LegendaryEventPlanWizardOpenedEvent
  | LegendaryEventPlanTargetChosenEvent
  | LegendaryEventPlanCreatedEvent
  | LegendaryEventAnnotationSetEvent
  | LegendaryEventDepthEstimateRestoredEvent
  | LegendaryEventNextTokenShownEvent
  | LegendaryEventTokenPlanExpandedEvent
  | LegendaryEventRunForecastExpandedEvent
  | LegendaryEventMasterTableViewedEvent
  | LegendaryEventMasterTableChangedEvent
  | LegendaryEventLastRunViewedEvent
  | LegendaryEventEarlierRunsExpandedEvent
  | LegendaryEventTierListViewedEvent
  | LegendaryEventTierListUnitOpenedEvent
  | AppInstallGuideOpenedEvent
  | AppInstallPromptAnsweredEvent
  | AppInstallCardDismissedEvent
  | ClientErrorEvent
