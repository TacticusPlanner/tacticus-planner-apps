import { describe, expect, it } from "vitest"
import type { UnitId } from "@workspace/game-domain"

import { passiveSummonerIds } from "./summoners"

describe("passiveSummonerIds", () => {
  it("keeps only the units whose summons are passive", () => {
    const unit = (id: string, summons: "none" | "active" | "passive") => ({
      id: id as UnitId,
      summons,
    })

    expect([
      ...passiveSummonerIds([
        unit("blackPossession", "passive"),
        unit("necroSpyder", "active"),
        unit("ultraCalgar", "none"),
        unit("adeptCelestine", "passive"),
      ]),
    ]).toEqual(["blackPossession", "adeptCelestine"])
  })
})
