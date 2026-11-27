import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

/** A character's portrait art; the synced roster's ids are plain strings. */
export const portraitSrc = (id: string): string =>
  characterIcon(id as UnitId) ?? ""
