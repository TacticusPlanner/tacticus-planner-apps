import {
  legacySessionStorage,
  legacyStorage,
  safeSessionStorage,
  safeStorage,
} from "./safe-storage"
import {
  preferenceRecordKey,
  sessionStorageKeys,
  staleReloadKey,
  storageKeys,
} from "./storage-keys"
import type {
  PreferenceField,
  PreferenceRecord,
  StorageKey,
} from "./storage-keys"

// How a value stored under an old single key is kept in its new record field.
type ValueKind = "string" | "boolean" | "number" | "json"

interface PreferenceMove<R extends PreferenceRecord = PreferenceRecord> {
  readonly from: string
  readonly record: R
  readonly field: PreferenceField<R>
  readonly kind: ValueKind
}

const move = <R extends PreferenceRecord>(
  from: string,
  record: R,
  field: PreferenceField<R>,
  kind: ValueKind = "string"
): PreferenceMove => ({ from, record, field, kind })

/** Per-device preferences that each had a key of their own before the records. */
export const preferenceMoves: readonly PreferenceMove[] = [
  move("nav.desktop.primaryMenu.v1", "nav", "primaryMenu"),
  move("nav.desktop.sectionMenu.v1", "nav", "sectionMenu"),
  move("collection.sort", "collection", "sort"),
  move("collection.view", "collection", "view"),
  move("collection.group", "collection", "group"),
  move("collection.quick", "collection", "quick"),
  move("collection.compare.fields", "collection", "compareFields"),
  move("teams.mode", "teams", "mode"),
  move("teams.layout", "teams", "layout"),
  move("teams.groupBy", "teams", "groupBy"),
  move(
    "progress.campaign-events.hide-completed",
    "progress",
    "campaignEventsHideCompleted"
  ),
  move(
    "progress.campaigns.unclaimed-only",
    "progress",
    "campaignsUnclaimedOnly"
  ),
  move("goals.overview.view", "goals", "view"),
  move("goals.overview.group", "goals", "group"),
  move("goals.overview.seasonFit", "goals", "seasonFit"),
  move("goals.overview.targetedFit", "goals", "targetedFit"),
  move("goals.overview.sort", "goals", "sort"),
  move("goals.insights.materials-show.v1", "goals", "insightsMaterials"),
  move("dailies.quick-filters.v1", "dailies", "quickFilters"),
  move("dailies.raid-grouping.v1", "dailies", "raidGrouping"),
  move("raids-filters.v1", "dailies", "raidsFilters", "json"),
  move("guildWar.zone", "guildWar", "zone"),
  move("guildWar.levelPicked", "guildWar", "level"),
  move("guildWar.picksWar", "guildWar", "picksWar"),
  move("guildWar.rarity", "guildWar", "rarity"),
  move("home.eventsCalendar.view", "home", "calendarView"),
  move("home-live-event-count", "home", "liveEventCount", "number"),
  move("home-token-count", "home", "tokenCount", "number"),
  move(
    "legendaryEvents.eventBoard.lanes",
    "legendaryEvents",
    "eventBoardLanes"
  ),
  move("legendaryEvents.lanes.mobile", "legendaryEvents", "mobileLane"),
  move(
    "legendaryEvents.leaderboard.lanes",
    "legendaryEvents",
    "leaderboardLanes"
  ),
  move("legendaryEvents.plan.battlesLane", "legendaryEvents", "battlesLane"),
  move(
    "legendaryEvents.unitChips.rankShading",
    "legendaryEvents",
    "rankShading"
  ),
  move(
    "legendaryEvents.tokenPlan.missionsOrder",
    "legendaryEvents",
    "missionsOrder",
    "boolean"
  ),
  move(
    "legendaryEvents.tokenPlan.expandBattles",
    "legendaryEvents",
    "expandBattles",
    "boolean"
  ),
  move(
    "legendaryEvents.upgradeImpact.open",
    "legendaryEvents",
    "upgradeImpactOpen"
  ),
  move(
    "legendaryEvents.tokenPlan.open",
    "legendaryEvents",
    "tokenPlanOpen",
    "boolean"
  ),
  move(
    "legendaryEvents.runForecast.open",
    "legendaryEvents",
    "runForecastOpen",
    "boolean"
  ),
  move(
    "legendaryEvents.planTab.tokenPlan.open",
    "legendaryEvents",
    "planTabTokenPlanOpen",
    "boolean"
  ),
  move(
    "legendaryEvents.planWizard.assumptions.open",
    "legendaryEvents",
    "planWizardAssumptionsOpen",
    "boolean"
  ),
  move(
    "legendaryEvents.planWizard.tokenPlan.open",
    "legendaryEvents",
    "planWizardTokenPlanOpen",
    "boolean"
  ),
  move(
    "legendaryEvents.planWizard.runForecast.open",
    "legendaryEvents",
    "planWizardRunForecastOpen",
    "boolean"
  ),
  move("app-install-card-dismissed", "dismissed", "appInstallCard"),
  move("tp.tour.autoStarted", "dismissed", "tourAutoStarted", "boolean"),
]

/** The account's own data, under its old names. A key listed twice moves from the first one found. */
export const accountMoves: readonly (readonly [string[], StorageKey])[] = [
  [["tp.session.owner"], storageKeys.userOwner],
  [
    ["tp.session.dailies.hse.averages.v1", "tp.dailies.hse.averages.v1"],
    storageKeys.userHseAverages,
  ],
  [
    ["tp.session.dailies.hse.progress.v2", "tp.dailies.hse.progress.v2"],
    storageKeys.userHseProgress,
  ],
  [
    ["tp.session.dailies.hse.tokens.v1", "tp.dailies.hse.tokens.v1"],
    storageKeys.userHseTokens,
  ],
  [
    ["tp.session.dailies.hre.progress.v1", "tp.dailies.hre.progress.v1"],
    storageKeys.userHreProgress,
  ],
  [
    ["tp.session.dailies.quest.progress.v1", "tp.dailies.quest.progress.v1"],
    storageKeys.userQuestProgress,
  ],
  [["tp.session.project.selected.v1"], storageKeys.userSelectedProject],
  [
    ["tp.session.v1-import.pending-material-steps"],
    storageKeys.userV1ImportPendingMaterialSteps,
  ],
  [["goals.overview.collapsedGroups"], storageKeys.userGoalsCollapsedGroups],
]

const oldShownTokensPrefix = "tp.session.lre.shownTokens."

/** Keys nothing reads any more: the Arena Dailies page, the project detail view, the beta promo,
 *  and the device-wide redirect marker that moved to `sessionStorage`. */
export const removedKeys: readonly string[] = [
  "tp.auth.pendingRedirect",
  "tp.dailies.arena.mode",
  "tp.dailies.arena.preferences",
  "goals.projectDetail.group",
  "home-beta-promo-dismissed",
]

const sessionMoves: readonly (readonly [string, string])[] = [
  ["nav.lastVisitedChild", sessionStorageKeys.navLastVisitedChild],
]
const oldStaleReloadPrefix = "tp:stale-reload:"

function convert(raw: string, kind: ValueKind): unknown {
  switch (kind) {
    case "string": {
      return raw
    }
    case "boolean": {
      return raw === "true" || raw === "1"
    }
    case "number": {
      const value = Number(raw)
      return raw.trim() === "" || !Number.isFinite(value) ? undefined : value
    }
    case "json": {
      try {
        return JSON.parse(raw) as unknown
      } catch {
        return undefined
      }
    }
  }
}

function readRecord(key: StorageKey): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(safeStorage.get(key) ?? "{}")
    return typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function migratePreferences() {
  const records = new Set(preferenceMoves.map((entry) => entry.record))
  for (const record of records) {
    const present = preferenceMoves.filter(
      (entry) =>
        entry.record === record && legacyStorage.get(entry.from) !== null
    )
    if (present.length === 0) continue
    const key = preferenceRecordKey(record)
    const next = readRecord(key)
    for (const { from, field, kind } of present) {
      const value = convert(legacyStorage.get(from) ?? "", kind)
      // A value already in the record was written by a newer build: it wins.
      if (value !== undefined && !(field in next)) next[field] = value
    }
    if (!safeStorage.trySet(key, JSON.stringify(next))) continue
    for (const { from } of present) legacyStorage.remove(from)
  }
}

function migrateAccountData() {
  for (const [sources, target] of accountMoves) {
    for (const source of sources) {
      const value = legacyStorage.get(source)
      if (value === null) continue
      if (safeStorage.get(target) === null) safeStorage.set(target, value)
      legacyStorage.remove(source)
    }
  }

  const shownTokenKeys = legacyStorage.keysStartingWith(oldShownTokensPrefix)
  if (shownTokenKeys.length === 0) return
  const shown = readRecord(storageKeys.userLegendaryEventShownTokens)
  for (const oldKey of shownTokenKeys) {
    const eventId = oldKey.slice(oldShownTokensPrefix.length)
    const tokens = convert(legacyStorage.get(oldKey) ?? "", "json")
    if (Array.isArray(tokens) && !(eventId in shown)) shown[eventId] = tokens
    legacyStorage.remove(oldKey)
  }
  safeStorage.set(
    storageKeys.userLegendaryEventShownTokens,
    JSON.stringify(shown)
  )
}

function migrateSessionKeys() {
  for (const [from, to] of sessionMoves) {
    const value = legacySessionStorage.get(from)
    if (value === null) continue
    legacySessionStorage.set(to, value)
    legacySessionStorage.remove(from)
  }
  for (const oldKey of legacySessionStorage.keysStartingWith(
    oldStaleReloadPrefix
  )) {
    const value = legacySessionStorage.get(oldKey)
    if (value !== null) {
      safeSessionStorage.set(
        staleReloadKey(oldKey.slice(oldStaleReloadPrefix.length)),
        value
      )
    }
    legacySessionStorage.remove(oldKey)
  }
}

/**
 * Moves values kept under older key names to the current ones (spec: browser-storage-resilience).
 * Runs at every start, before anything reads storage: a tab still running an older build may
 * write an old key at any time, and the next start folds it in. Costs a few reads when there is
 * nothing to move. Remove the old names here once no device can still hold them.
 */
export function migrateStorage(): void {
  migratePreferences()
  migrateAccountData()
  migrateSessionKeys()
  for (const key of removedKeys) legacyStorage.remove(key)
}
