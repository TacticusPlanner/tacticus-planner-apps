import { describe, expect, it } from "vitest"

import { statIcon } from "./stat"

describe("statIcon", () => {
  it("returns the game sprite path for each known stat kind", () => {
    expect(statIcon("health")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_stat_health_01.webp"
    )
    expect(statIcon("movement")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_stat_move_01.webp"
    )
  })
})
