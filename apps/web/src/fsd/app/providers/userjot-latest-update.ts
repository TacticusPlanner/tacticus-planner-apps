import type { UserJotOpenTarget } from "./userjot-targets"

/**
 * The newest changelog post, read from the public feed the widget itself loads its Updates tab
 * from (`GET /widget/v2/:projectId/updates`, CORS `*`, no auth for public posts). The v3 SDK has no
 * call that names the newest post, so this is the only way to open it directly. The feed is not a
 * documented API: any failure falls back to the Updates list.
 */
const USERJOT_UPDATES_FEED = "https://widget.userjot.com/widget/v2"
const FEED_TIMEOUT_MS = 3000
const MAX_ID_LENGTH = 64

/** The last post the Changelog entry point opened directly, so a dot that stays lit for another
 *  reason (a reply on the user's own post) does not reopen the same post every time. */
export const LAST_OPENED_UPDATE_KEY = "tp.userjot.lastOpenedUpdateId"

type UpdatesFeedPage = { items?: { id?: unknown }[] }

export async function fetchLatestUpdateId(
  projectId: string,
  fetchImpl: typeof fetch = fetch
): Promise<string | null> {
  const url = `${USERJOT_UPDATES_FEED}/${encodeURIComponent(projectId)}/updates?limit=1`
  const response = await fetchImpl(url, {
    cache: "no-store",
    credentials: "omit",
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
  })
  if (!response.ok) return null
  const page = (await response.json()) as UpdatesFeedPage
  const id = page.items?.[0]?.id
  return typeof id === "string" && id.length > 0 && id.length <= MAX_ID_LENGTH
    ? id
    : null
}

/** Home without unread activity. With it, the newest post when it is not the one this entry point
 *  last opened, otherwise the Updates list. */
export function changelogTarget(
  hasUnread: boolean,
  latestId: string | null,
  lastOpenedId: string | null
): UserJotOpenTarget {
  if (!hasUnread) return { to: "home" }
  return latestId && latestId !== lastOpenedId
    ? { to: "updates", updateId: latestId }
    : { to: "updates" }
}

function readLastOpenedUpdateId(): string | null {
  try {
    return localStorage.getItem(LAST_OPENED_UPDATE_KEY)
  } catch {
    return null
  }
}

function rememberOpenedUpdateId(id: string) {
  try {
    localStorage.setItem(LAST_OPENED_UPDATE_KEY, id)
  } catch {
    // Storage unavailable (private mode): the post may open again next time, which is harmless.
  }
}

/** Where the Changelog entry point opens: Home without unread activity, otherwise the newest post
 *  (remembered once opened), falling back to the Updates list when the feed cannot be read. */
export async function resolveChangelogTarget(
  hasUnread: boolean,
  projectId: string | undefined,
  fetchImpl: typeof fetch = fetch
): Promise<UserJotOpenTarget> {
  if (!hasUnread) return { to: "home" }
  if (!projectId) return { to: "updates" }
  const latestId = await fetchLatestUpdateId(projectId, fetchImpl).catch(
    () => null
  )
  const target = changelogTarget(hasUnread, latestId, readLastOpenedUpdateId())
  if ("updateId" in target) rememberOpenedUpdateId(target.updateId)
  return target
}
