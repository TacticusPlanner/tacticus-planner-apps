/**
 * Every key the app keeps in web storage (spec: browser-storage-resilience). `safeStorage` and
 * `safeSessionStorage` accept only these, so a key that is not listed here does not compile.
 *
 * Naming: `tp.<feature>` for a device preference record, `tp.user.<name>` for the signed-in
 * account's own data (sign-out removes the prefix), `tp.<area>.<name>` for anything else. No
 * version suffixes: each field validates on read and falls back to its default, so a changed shape
 * loses that field, not the whole record. `theme` and `i18nextLng` keep their names because the
 * pre-paint theme script and the i18next language detector read them before the app runs.
 */

/**
 * Per-device preferences, one JSON record per feature, stored under `tp.<record>`. The fields a
 * record may hold are listed so a typo does not compile; each feature validates its own values.
 */
export const preferenceRecords = {
  nav: ["primaryMenu", "sectionMenu"],
  collection: ["sort", "view", "group", "quick", "compareFields"],
  teams: ["mode", "layout", "groupBy"],
  progress: ["campaignEventsHideCompleted", "campaignsUnclaimedOnly"],
  goals: [
    "view",
    "group",
    "seasonFit",
    "targetedFit",
    "sort",
    "insightsMaterials",
  ],
  dailies: ["quickFilters", "raidGrouping", "raidsFilters"],
  guildWar: ["zone", "level", "picksWar", "rarity"],
  home: ["calendarView", "liveEventCount", "tokenCount"],
  legendaryEvents: [
    "eventBoardLanes",
    "mobileLane",
    "leaderboardLanes",
    "battlesLane",
    "rankShading",
    "missionsOrder",
    "expandBattles",
    "upgradeImpactOpen",
    "tokenPlanOpen",
    "runForecastOpen",
    "planTabTokenPlanOpen",
    "planWizardAssumptionsOpen",
    "planWizardTokenPlanOpen",
    "planWizardRunForecastOpen",
  ],
  dismissed: ["appInstallCard", "tourAutoStarted"],
} as const

export type PreferenceRecord = keyof typeof preferenceRecords
export type PreferenceField<R extends PreferenceRecord> =
  (typeof preferenceRecords)[R][number]

export function preferenceRecordKey<R extends PreferenceRecord>(
  record: R
): `tp.${R}` {
  return `tp.${record}`
}

/** The signed-in account's own data starts with this prefix, so sign-out removes it (spec:
 *  redirect-authentication). Per-device preferences use any other key. */
export const userStoragePrefix = "tp.user."

/** `localStorage` keys outside the preference records. */
export const storageKeys = {
  // Per device, read before the app runs (see the note above).
  theme: "theme",
  language: "i18nextLng",
  // Per device.
  featureFlags: "tp.featureFlags",
  userjotLastOpenedUpdate: "tp.userjot.lastOpenedUpdateId",
  // Sign-in bookkeeping, per device; sign-out forgets it.
  authJournal: "tp.auth.journal",
  authRedirectLock: "tp.auth.redirectLock",
  authAccountHint: "tp.auth.accountHint",
  authFreshLogin: "tp.auth.freshLogin",
  authQuietRenewal: "tp.auth.quietRenewal",
  authAutoRedirects: "tp.auth.autoRedirects",
  accountSetupComplete: "tp.account.setupComplete",
  // The signed-in account's data (`tp.user.`).
  userOwner: "tp.user.owner",
  userHseAverages: "tp.user.dailies.hse.averages",
  userHseProgress: "tp.user.dailies.hse.progress",
  userHseTokens: "tp.user.dailies.hse.tokens",
  userHreProgress: "tp.user.dailies.hre.progress",
  userQuestProgress: "tp.user.dailies.quest.progress",
  userSelectedProject: "tp.user.project.selected",
  userGoalsCollapsedGroups: "tp.user.goals.collapsedGroups",
  userLegendaryEventShownTokens: "tp.user.legendaryEvents.shownTokens",
  userV1ImportPendingMaterialSteps: "tp.user.v1Import.pendingMaterialSteps",
  userNavRecentPages: "tp.user.nav.recentPages",
} as const

export type StorageKey =
  (typeof storageKeys)[keyof typeof storageKeys] | `tp.${PreferenceRecord}`

/** `sessionStorage` keys: state that only has to outlive one tab's reload or redirect. */
export const sessionStorageKeys = {
  navLastVisitedChild: "tp.nav.lastVisitedChild",
  authTabId: "tp.auth.tabId",
  authPendingRedirect: "tp.auth.pendingRedirect",
  signInAccountKeptNotice: "tp.signInAccountKeptNotice",
} as const

const staleReloadPrefix = "tp.staleReload."

/** One stale-build reload marker per URL (path + query). */
export function staleReloadKey(url: string): `tp.staleReload.${string}` {
  return `${staleReloadPrefix}${url}`
}

export type SessionStorageKey =
  | (typeof sessionStorageKeys)[keyof typeof sessionStorageKeys]
  | `tp.staleReload.${string}`
