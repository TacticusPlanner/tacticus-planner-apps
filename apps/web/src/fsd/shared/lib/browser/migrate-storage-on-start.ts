import { legacySessionStorage, legacyStorage } from "./safe-storage"

/**
 * Starts of the key names `storage-migration.ts` moves or deletes. Checking these is cheap, so the
 * migration code loads only on a device that still holds an old key (most starts load nothing).
 */
export const legacyKeyPrefixes: readonly string[] = [
  "tp.session.",
  "tp.dailies.",
  "tp.tour.",
  "tp.auth.pendingRedirect",
  "nav.",
  "collection.",
  "teams.",
  "progress.",
  "goals.",
  "dailies.",
  "raids-filters",
  "guildWar.",
  "home",
  "legendaryEvents.",
  "app-install-card",
]

export const legacySessionKeyPrefixes: readonly string[] = [
  "nav.",
  "tp:stale-reload:",
]

function holdsLegacyKeys(): boolean {
  return (
    legacyKeyPrefixes.some(
      (prefix) => legacyStorage.keysStartingWith(prefix).length > 0
    ) ||
    legacySessionKeyPrefixes.some(
      (prefix) => legacySessionStorage.keysStartingWith(prefix).length > 0
    )
  )
}

/**
 * Moves values kept under older key names to the current ones, before anything reads storage
 * (spec: browser-storage-resilience). Loads the migration only when an old key is present.
 */
export async function migrateStorageOnStart(): Promise<void> {
  if (!holdsLegacyKeys()) return
  const { migrateStorage } = await import("./storage-migration")
  migrateStorage()
}
