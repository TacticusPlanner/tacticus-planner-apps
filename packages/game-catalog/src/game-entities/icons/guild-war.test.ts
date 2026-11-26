// @vitest-environment node
import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import {
  GUILD_WAR_BOARD_IDS,
  guildWarBoardImage,
  guildWarBoardImageLarge,
  guildWarBuffIcon,
  guildWarTokenIcon,
  guildWarZoneIcon,
} from "./guild-war"

describe("guild war icons", () => {
  it("maps a zone's visual id to its war-map picture", () => {
    expect(guildWarZoneIcon("armory")).toMatch(
      /ui\/ui_guild_wars_zones_amory_perspective\.webp$/
    )
    expect(guildWarZoneIcon("radarStation")).toMatch(
      /ui_guild_wars_zones_radar_station_perspective\.webp$/
    )
    expect(guildWarZoneIcon("unknown")).toBeUndefined()
  })

  it("maps a buff id to its badge, else the generic one", () => {
    expect(guildWarBuffIcon("EnvFlakFire_Regional")).toMatch(
      /atlases\/ui_icon_uniteffect_flakfire_01\.webp$/
    )
    expect(guildWarBuffIcon("EnvDefenderHealthBuff2_Global")).toMatch(
      /ui_icon_uniteffect_defender_health_buff_01\.webp$/
    )
    expect(guildWarBuffIcon("EnvSomethingNew_Local")).toMatch(
      /ui_icon_uniteffect_guildwar_generic_buff_01\.webp$/
    )
  })

  it("points the token at the Guild War token sprite", () => {
    expect(guildWarTokenIcon()).toMatch(
      /ui\/ui_icon_resource_token_guildwars\.webp$/
    )
  })

  it("points a map-pool board at its downscaled art, and a board with none at nothing", () => {
    expect(guildWarBoardImage("EC1_09")).toBe(
      "/game_catalog/curated/guild_war_boards/EC1_09.webp"
    )
    expect(guildWarBoardImage("C9_99")).toBeUndefined()
    expect(guildWarBoardImageLarge("EC1_09")).toBe(
      "/game_catalog/curated/guild_war_boards_large/EC1_09.webp"
    )
    expect(guildWarBoardImageLarge("C9_99")).toBeUndefined()
  })

  it.each(["guild_war_boards", "guild_war_boards_large"])(
    "lists exactly the boards in the %s directory",
    (folder) => {
      const shipped = readdirSync(
        fileURLToPath(
          new URL(
            `../../../../../apps/web/public/game_catalog/curated/${folder}/`,
            import.meta.url
          )
        )
      )
        .filter((file) => file.endsWith(".webp"))
        .map((file) => file.slice(0, -".webp".length))
        .sort()
      expect([...GUILD_WAR_BOARD_IDS].sort()).toEqual(shipped)
    }
  )
})
