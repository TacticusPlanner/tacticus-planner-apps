import { describe, expect, it } from "vitest"

import { TEAM_MODES } from "../model/team-modes"
import { teamModeIcon } from "./team-mode-icon"

describe("teamModeIcon", () => {
  it("gives every mode a game icon", () => {
    for (const mode of TEAM_MODES) {
      expect(teamModeIcon(mode)).toMatch(
        /^\/game_catalog\/datamines\/.+\.webp$/
      )
    }
  })

  it("uses the game's battle tokens", () => {
    expect(teamModeIcon("warOffense")).toBe(teamModeIcon("warDefense"))
    expect(teamModeIcon("guildRaid")).toContain("token_battle_guildboss")
    expect(teamModeIcon("tournamentArena")).toContain("token_sync_pvp")
    expect(teamModeIcon("incursion")).toContain("battle_token_mow")
  })
})
