// Test-only entry point: lets consumers seed the real player-data store instead of mocking its queries.
import Dexie from "dexie"

import { playerDataDbName } from "./player-data-storage"

export { replacePlayerDataChunk } from "./player-data-storage"

/** Drops the player-data database; Dexie reopens it on next access. */
export function deletePlayerDataDatabase(): Promise<void> {
  return Dexie.delete(playerDataDbName)
}
