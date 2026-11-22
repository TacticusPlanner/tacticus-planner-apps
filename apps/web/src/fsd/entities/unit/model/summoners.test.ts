import { describe, expect, it } from "vitest"
import type { UnitId } from "@workspace/game-domain"

import { forcedSummonerIds } from "./summoners"

const unit = (id: string, summons: "none" | "optional" | "forced") => ({
  id: id as UnitId,
  summons,
})

describe("forcedSummonerIds", () => {
  it("keeps only the units whose summons are forced", () => {
    expect([
      ...forcedSummonerIds([
        unit("blackPossession", "forced"),
        unit("necroSpyder", "optional"),
        unit("ultraCalgar", "none"),
        unit("adeptCelestine", "forced"),
      ]),
    ]).toEqual(["blackPossession", "adeptCelestine"])
  })
})
