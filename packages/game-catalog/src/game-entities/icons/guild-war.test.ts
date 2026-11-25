import { describe, expect, it } from "vitest"

import {
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
})
