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
  type:
    | "legendary_event_team_created"
    | "legendary_event_team_edited"
    | "legendary_event_team_deleted"
  eventId: string
  laneId: string
  memberCount: number
  objectiveCount: number
}

/** A team's clear depth for the current run was set by hand (null when cleared). */
type LegendaryEventDepthSetEvent = {
  type: "legendary_event_depth_set"
  eventId: string
  laneId: string
  depth: number | null
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
  | LegendaryEventDepthSetEvent
  | LegendaryEventRunInputsSavedEvent
  | LegendaryEventPaidOptionsToggledEvent
  | LegendaryEventAnnotationSetEvent
