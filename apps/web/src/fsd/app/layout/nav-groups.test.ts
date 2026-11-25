import { describe, expect, it } from "vitest"

import { childrenOfActiveGroup, groupNavChildren } from "./nav-groups"
import { required } from "@/shared/lib"

import { navItems } from "./nav-items"

const childrenOf = (path: string) =>
  required(navItems.find((item) => item.path === path)?.children, path)
const guild = childrenOf("/guild")
const library = childrenOf("/library")

describe("nav groups", () => {
  it("splits Guild into its Guild and Guild War groups", () => {
    expect(
      groupNavChildren(guild).map((group) => [
        group.labelKey,
        group.children.map((child) => child.path),
      ])
    ).toEqual([
      ["guild.groups.guild", ["/guild/members", "/guild/settings"]],
      ["guild.groups.guildWar", ["/guild/war/offense", "/guild/war/history"]],
    ])
  })

  it("keeps an ungrouped section as one unlabelled group", () => {
    const groups = groupNavChildren(library)
    expect(groups).toHaveLength(1)
    expect(required(groups[0], "group").labelKey).toBeUndefined()
  })

  it("tabs only the active child's group", () => {
    expect(
      childrenOfActiveGroup(guild, "/guild/war/offense").map((c) => c.path)
    ).toEqual(["/guild/war/offense", "/guild/war/history"])
    expect(
      childrenOfActiveGroup(guild, "/guild/members").map((c) => c.path)
    ).toEqual(["/guild/members", "/guild/settings"])
    expect(childrenOfActiveGroup(library, "/library/npcs")).toHaveLength(
      library.length
    )
  })
})
