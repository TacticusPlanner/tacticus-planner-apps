import { describe, expect, it } from "vitest"
import type { UnitSummons } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import { forcedSummonerIds } from "./summoners"

const unit = (id: string, summons: UnitSummons) => ({
  id: id as UnitId,
  summons,
})

describe("forcedSummonerIds", () => {
  it("keeps only the units whose summons are forced", () => {
    expect([
      ...forcedSummonerIds([
        unit("blackPossession", "forced"),
        unit("necroSpyder", "optional"),
        unit("admecMarshall", "conditional"),
        unit("ultraCalgar", "none"),
        unit("adeptCelestine", "forced"),
      ]),
    ]).toEqual(["blackPossession", "adeptCelestine"])
  })
})
