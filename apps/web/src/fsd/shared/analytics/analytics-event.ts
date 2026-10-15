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

/** The plan's Show paid options switch was turned on or off. */
type LegendaryEventPaidOptionsToggledEvent = {
  type: "legendary_event_paid_options_toggled"
  eventId: string
  on: boolean
}

/** A Maybe clear / Stop here mark was set (or cleared, status null) on one cell or a whole battle
 *  of the Synced progress grid. */
type LegendaryEventAnnotationSetEvent = {
  type: "legendary_event_annotation_set"
  eventId: string
  laneId: string
  battleIndex: number
  cellCount: number
  status: "maybeClear" | "stopHere" | null
  scope: "cell" | "battle"
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
  | LegendaryEventAnnotationSetEvent
  | LegendaryEventDepthEstimateRestoredEvent
