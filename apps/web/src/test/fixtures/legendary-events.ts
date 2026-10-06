// Legendary Event fixtures shaped like the served `lres` view, built from the real catalog source
// (tacticus-planner-api GameCatalog Data/lres). Run start dates are pinned for tests: Lysander's is
// its real 2026-08-30 start; Uthar's and Farsight's are moved into the future so the three events
// cover the active and upcoming lifecycle states.
import type {
  LegendaryEventCommonStorageModel,
  LegendaryEventStorageModel,
} from "@workspace/game-catalog"

import fixtures from "./legendary-events.json"

export const lysanderEvent =
  fixtures.lysander as unknown as LegendaryEventStorageModel
export const utharEvent =
  fixtures.uthar as unknown as LegendaryEventStorageModel
export const farsightEvent =
  fixtures.farsight as unknown as LegendaryEventStorageModel
export const legendaryEventCommon =
  fixtures.common as unknown as LegendaryEventCommonStorageModel
