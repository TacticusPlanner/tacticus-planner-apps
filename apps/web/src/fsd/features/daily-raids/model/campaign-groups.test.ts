import { battleIdSchema } from "@workspace/game-domain"
import { describe, expect, it } from "vitest"

import { groupEntriesByCampaign } from "./campaign-groups"

const battle = (id: string) => battleIdSchema.parse(id)

const location = (id: string, campaignName: string, icon?: string) => ({
  id,
  campaignName,
  nodeLabel: "Elite 1",
  shortLabel: `${campaignName} 1`,
  challenge: false,
  icon,
})

const entry = (goalId: string, resourceId: string, battleId: string) => ({
  goalId,
  resourceId: resourceId as never,
  battleId: battle(battleId),
  raidsPerformed: 2,
  itemsFarmed: 1,
  energySpent: 12,
  dailyAttempts: 5,
  remainingBefore: 3,
})

const locations = new Map([
  [battle("I1"), location("I1", "Indomitus", "indomitus.webp")],
  [battle("I2"), location("I2", "Indomitus")],
  [battle("C1"), location("C1", "Fall of Cadia")],
  [battle("M1"), location("M1", "Indomitus Mirror")],
])

describe("groupEntriesByCampaign", () => {
  it("gathers a campaign's raids in one group, campaigns in first-appearance order", () => {
    const groups = groupEntriesByCampaign(
      [
        entry("g1", "A", "I1"),
        entry("g1", "B", "C1"),
        entry("g2", "C", "I2"),
        entry("g2", "D", "M1"),
        entry("g3", "E", "C1"),
      ],
      locations
    )

    expect(
      groups.map(({ campaignName, icon, resources }) => ({
        campaignName,
        icon,
        resources: resources.map(({ resourceId, entries }) => [
          resourceId,
          entries.map((item) => item.battleId),
        ]),
      }))
    ).toEqual([
      {
        campaignName: "Indomitus",
        icon: "indomitus.webp",
        resources: [
          ["A", ["I1"]],
          ["C", ["I2"]],
        ],
      },
      {
        campaignName: "Fall of Cadia",
        icon: undefined,
        resources: [
          ["B", ["C1"]],
          ["E", ["C1"]],
        ],
      },
      {
        campaignName: "Indomitus Mirror",
        icon: undefined,
        resources: [["D", ["M1"]]],
      },
    ])
  })

  it("merges one node raided for the same resource by two goals into one row", () => {
    const [group] = groupEntriesByCampaign(
      [entry("g1", "A", "I1"), entry("g2", "A", "I1"), entry("g2", "A", "I2")],
      locations
    )

    expect(group?.resources).toHaveLength(1)
    expect(group?.resources[0]?.entries).toEqual([
      {
        ...entry("g1", "A", "I1"),
        raidsPerformed: 4,
        itemsFarmed: 2,
        energySpent: 24,
        remainingBefore: 6,
      },
      entry("g2", "A", "I2"),
    ])
  })

  it("groups a battle the catalog does not describe under its own id", () => {
    const groups = groupEntriesByCampaign([entry("g1", "A", "X9")], locations)

    expect(groups.map((group) => group.campaignName)).toEqual(["X9"])
  })
})
