import { clearPlayerDataDb, deletePlayerDataDb } from "@workspace/player-data"

import {
  accountStorageKey,
  accountStoragePrefix,
  safeStorage,
} from "@/shared/lib"
import { clearLocalDataCache } from "@/shared/local-data"

// Which account the browser's local copy (player-data database, `tp.session.*` keys) belongs to.
// Under the prefix itself, so clearing the copy also forgets its owner.
const OWNER_KEY = accountStorageKey("owner")

/**
 * Deletes the browser's local copy of an account's data: the player-data database, the in-memory
 * local-data cache, and every `tp.session.*` key. The game catalog is public data shared by every
 * visitor, so it stays (spec: redirect-authentication).
 */
export async function clearAccountLocalData(): Promise<void> {
  await deletePlayerDataDb()
  clearLocalDataCache()
  safeStorage.removeByPrefix(accountStoragePrefix)
}

/**
 * Runs before the first render, once the signed-in account is known. A local copy left by a different
 * account (a session that ended without signing out, such as a cancelled re-authentication that
 * cleared the token cache) is deleted before anything can read it; the copy is then recorded as this
 * account's. A copy with no recorded owner predates the record and is kept as the current account's.
 */
export async function claimAccountLocalData(
  accountId: string | undefined
): Promise<void> {
  if (!accountId) return

  const owner = safeStorage.get(OWNER_KEY)
  if (owner !== null && owner !== accountId) {
    // Emptied, not deleted: unlike sign-out, the app keeps running on this database.
    await clearPlayerDataDb()
    clearLocalDataCache()
    safeStorage.removeByPrefix(accountStoragePrefix)
  }

  safeStorage.set(OWNER_KEY, accountId)
}
