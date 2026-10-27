import {
  hreFixture,
  progressionRulesFixture,
} from "@workspace/game-catalog/testing"

import { toHreRules, type HreRules } from "@/features/hre-missions"

/** Weirdboy's served `hre` record (datamine 1.43.157) as the missions and reward rules it yields. */
export const hreRules = toHreRules(
  hreFixture,
  [progressionRulesFixture],
  "orksWeirdboy"
) as HreRules

export const hreMissions = hreRules.missions
