import { progressionRulesFixture } from "@workspace/game-catalog/testing"

import { toLevelRules, type LevelRules } from "@/features/goal-farming"

/** The served `progression-rules` record (datamine 1.43.157) as the level rules it yields. */
export const levelRules = toLevelRules([progressionRulesFixture]) as LevelRules
