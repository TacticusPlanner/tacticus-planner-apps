import { describe, expect, it } from "vitest"
import type { UnitId } from "@workspace/game-domain"

import { passiveSummonerIds } from "./summoners"

const unit = (id: string, summons: "none" | "active" | "passive") => ({
  id: id as UnitId,
  summons,
})

describe("passiveSummonerIds", () => {
  it("keeps only the units whose summons are passive", () => {
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
