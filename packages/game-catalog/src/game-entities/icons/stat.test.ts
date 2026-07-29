import { describe, expect, it } from "vitest"

import { statIcon } from "./stat"

describe("statIcon", () => {
  it("returns a stat_icons path for each known stat kind", () => {
    expect(statIcon("health")).toBe(
      "/game_catalog/stat_icons/ui_icon_stat_health_01.png"
    )
    expect(statIcon("movement")).toBe(
      "/game_catalog/stat_icons/ui_icon_stat_move_01.png"
    )
  })
})
