// Legendary Event fixtures shaped like the served `lres` view, built from the real catalog source
// (tacticus-planner-api GameCatalog Data/lres). Run start dates are pinned for tests: Lysander's is
// its real 2026-08-30 start; Uthar's and Farsight's are moved into the future so the three events
// cover the active and upcoming lifecycle states. Each lane's `availableUnitIds` is the server's
// evaluation over `legendary-event-characters.json`. Each event carries its own `rewards` ladder
// and mission lists from its raw file (Uthar and Farsight have 54 chests, Lysander 60).
import type { LegendaryEventStorageModel } from "@workspace/game-catalog"

import fixtures from "./legendary-events.json"

export const lysanderEvent =
  fixtures.lysander as unknown as LegendaryEventStorageModel
export const utharEvent =
  fixtures.uthar as unknown as LegendaryEventStorageModel
export const farsightEvent =
  fixtures.farsight as unknown as LegendaryEventStorageModel

// Lysander Alpha as synced in the team-planning feedback: battles 1–13 have defeat-all and No
// Resilient cleared at full kill and high scores, Eviscerate in battles 5–6 only, Flying nowhere;
// battle 14 onward is untouched. Objective ids: 0 defeat-all, 1 Eviscerate, 2 Suppressive Fire,
// 3 Flying, 4 Min 5 Hits, 5 No Resilient.
const lysanderAlphaCleared = [
  ...Array.from({ length: 4 }, () => [0, 2, 4, 5]),
  [0, 1, 2, 4, 5],
  [0, 1, 2, 4, 5],
  [0, 2, 5],
  [0, 2, 5],
  [0, 4, 5],
  [0, 4, 5],
  [0, 5],
  [0, 5],
  [0, 5],
]
export const lysanderAlphaProgressRecord = {
  encounters: lysanderAlphaCleared.map((objectivesCleared, index) => ({
    objectivesCleared,
    highScore: lysanderEvent.alpha.battlesPoints[index]!,
    encounterPoints: lysanderEvent.alpha.battlesPoints[index]!,
  })),
}
