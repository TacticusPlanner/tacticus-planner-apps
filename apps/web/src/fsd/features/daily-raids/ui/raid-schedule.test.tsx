import { describe, expect, it } from "vitest"
import userEvent from "@testing-library/user-event"
import { battleIdSchema } from "@workspace/game-domain"

import { render, screen, within } from "@/test/render"

import { dailyRaidResourceKey } from "../model/daily-raids.domain"
import { RaidSchedule } from "./raid-schedule"

const b1 = battleIdSchema.parse("B1")
const b2 = battleIdSchema.parse("B2")

const goal = {
  goalId: "g1",
  priority: 1,
  unitId: "hero1" as never,
  unitType: "Character" as const,
  unitLabel: "Hero One",
  targetLabel: "Unlock",
  goalKind: "Unlock" as const,
}

const location = (
  id: string,
  campaignName: string,
  nodeLabel: string,
  difficultyLabel?: string
) => ({
  id,
  campaignName,
  nodeLabel,
  difficultyLabel,
  shortLabel: `${campaignName} ${nodeLabel}`,
  challenge: false,
  icon: undefined,
})

function entry(
  battleId: ReturnType<typeof battleIdSchema.parse>,
  raidsPerformed: number,
  dailyAttempts = 10
) {
  return {
    goalId: "g1",
    resourceId: "upgrade1" as never,
    battleId,
    raidsPerformed,
    itemsFarmed: raidsPerformed,
    energySpent: raidsPerformed * 6,
    dailyAttempts,
    remainingBefore: raidsPerformed,
  }
}

const bonusGoal = {
  goalId: "g2",
  priority: 2,
  unitId: "hero2" as never,
  unitType: "Character" as const,
  unitLabel: "Hero Two",
  targetLabel: "Unlock",
  goalKind: "Unlock" as const,
}

function bonusEntry(
  battleId: ReturnType<typeof battleIdSchema.parse>,
  raidsPerformed: number,
  dailyAttempts = 10
) {
  return {
    goalId: "g2",
    resourceId: "upgrade2" as never,
    battleId,
    raidsPerformed,
    itemsFarmed: raidsPerformed,
    energySpent: raidsPerformed * 6,
    dailyAttempts,
    remainingBefore: raidsPerformed,
  }
}

describe("RaidSchedule combined grouping", () => {
  it("lists every goal's resources in one list, in entry order, with no goal headers and pooled progress", () => {
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map()}
        entries={[
          bonusEntry(b2, 1),
          { ...entry(b1, 1), resourceId: "upgrade1" as never },
        ]}
        goalsById={
          new Map([
            ["g1", goal],
            ["g2", bonusGoal],
          ])
        }
        grouping="combined"
        locationsByBattleId={
          new Map([
            [b1, location("B1", "Indomitus", "Elite 4")],
            [b2, location("B2", "Fall of Cadia", "Standard 7")],
          ])
        }
        resourceLabels={new Map()}
        resourceProgress={new Map([["upgrade2", { owned: 3, target: 20 }]])}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    expect(screen.queryByText("Hero One")).not.toBeInTheDocument()
    expect(screen.queryByText("Hero Two")).not.toBeInTheDocument()
    const cards = [
      ...screen
        .getByTestId("schedule")
        .querySelectorAll<HTMLElement>("[data-testid^='raid-card-']"),
    ].map((element) => element.dataset.testid)
    expect(cards).toEqual(["raid-card-g2-upgrade2", "raid-card-g1-upgrade1"])
    expect(screen.getByTestId("raid-card-g2-upgrade2")).toHaveTextContent(
      "3 / 20"
    )
  })
})

describe("RaidSchedule location emphasis", () => {
  it("orders resources by duration, energy, then resource identity within a goal", () => {
    const resources = [
      { ...entry(b1, 1), resourceId: "fast" as never },
      { ...entry(b2, 1), resourceId: "slow" as never },
      { ...entry(b1, 1), resourceId: "energy-low" as never },
      { ...entry(b2, 1), resourceId: "energy-high" as never },
      { ...entry(b1, 1), resourceId: "beta" as never },
      { ...entry(b2, 1), resourceId: "alpha" as never },
    ]
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map()}
        entries={resources}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([
            [b1, location("B1", "Indomitus", "Elite 4")],
            [b2, location("B2", "Fall of Cadia", "Standard 7")],
          ])
        }
        resourceLabels={new Map()}
        resourceProgress={new Map()}
        resourceUrgencyByGoalAndResource={
          new Map([
            ["g1:fast", { days: 1, energyTotal: 6 }],
            ["g1:slow", { days: 3, energyTotal: 18 }],
            ["g1:energy-low", { days: 2, energyTotal: 12 }],
            ["g1:energy-high", { days: 2, energyTotal: 18 }],
            ["g1:beta", { days: 1, energyTotal: 6 }],
            ["g1:alpha", { days: 1, energyTotal: 6 }],
          ])
        }
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    const resourceIds = [
      ...screen
        .getByTestId("raid-resource-grid-g1")
        .querySelectorAll<HTMLElement>("[data-testid^='raid-card-g1-']"),
    ].map((element) => element.dataset.testid?.replace("raid-card-g1-", ""))
    expect(resourceIds).toEqual([
      "slow",
      "energy-high",
      "energy-low",
      "alpha",
      "beta",
      "fast",
    ])
  })

  it("pulls a same-campaign upgrade within 50 energy up next to the earlier one", () => {
    const b3 = battleIdSchema.parse("B3")
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map()}
        entries={[
          { ...entry(b1, 1), resourceId: "X" as never },
          { ...entry(b2, 1), resourceId: "Y" as never },
          { ...entry(b3, 1), resourceId: "Z" as never },
        ]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([
            [
              b1,
              {
                ...location("B1", "Indomitus", "Elite 4"),
                campaignKey: "indomitus:Elite",
              },
            ],
            [
              b2,
              {
                ...location("B2", "Fall of Cadia", "Elite 7"),
                campaignKey: "cadia:Elite",
              },
            ],
            [
              b3,
              {
                ...location("B3", "Indomitus", "Elite 9"),
                campaignKey: "indomitus:Elite",
              },
            ],
          ])
        }
        resourceLabels={new Map()}
        resourceProgress={new Map()}
        resourceUrgencyByGoalAndResource={
          new Map([
            ["g1:X", { days: 3, energyTotal: 90 }],
            ["g1:Y", { days: 3, energyTotal: 80 }],
            ["g1:Z", { days: 2, energyTotal: 50 }],
          ])
        }
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    const resourceIds = [
      ...screen
        .getByTestId("raid-resource-grid-g1")
        .querySelectorAll<HTMLElement>("[data-testid^='raid-card-g1-']"),
    ].map((element) => element.dataset.testid?.replace("raid-card-g1-", ""))
    expect(resourceIds).toEqual(["X", "Z", "Y"])
  })

  it("shows each campaign once as a header, with one row per battle and its upgrade", () => {
    const b3 = battleIdSchema.parse("B3")
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map()}
        emphasis="location"
        entries={[
          { ...entry(b1, 1), resourceId: "X" as never },
          { ...entry(b2, 1), resourceId: "Y" as never },
          { ...entry(b3, 1), resourceId: "Z" as never },
        ]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([
            [
              b1,
              {
                ...location("B1", "Indomitus", "Elite 4", "Elite"),
                campaignKey: "indomitus:Elite",
              },
            ],
            [
              b2,
              {
                ...location("B2", "Fall of Cadia", "Elite 7", "Elite"),
                campaignKey: "cadia:Elite",
              },
            ],
            [
              b3,
              {
                ...location("B3", "Indomitus", "Elite 9", "Elite"),
                campaignKey: "indomitus:Elite",
              },
            ],
          ])
        }
        resourceLabels={new Map()}
        resourceProgress={new Map()}
        resourceUrgencyByGoalAndResource={
          new Map([
            ["g1:X", { days: 3, energyTotal: 90 }],
            ["g1:Y", { days: 3, energyTotal: 80 }],
            ["g1:Z", { days: 2, energyTotal: 50 }],
          ])
        }
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    const grid = screen.getByTestId("raid-resource-grid-g1")
    expect(
      within(grid)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual(["Indomitus Elite"])
    // Fall of Cadia has one battle: no header, its row names it in full.
    expect(screen.getByTestId("raid-location-B2")).toHaveTextContent(
      "Fall of Cadia Elite 7"
    )
    expect(
      within(grid)
        .getAllByRole("listitem")
        .map((row) => row.dataset.testid)
    ).toEqual(["raid-location-B1", "raid-location-B3", "raid-location-B2"])
    expect(screen.getByTestId("raid-location-B3")).toHaveTextContent("Battle 9")
    expect(screen.getByTestId("raid-upgrade-g1-Z")).toBeInTheDocument()
  })

  it("uses the same urgency order for Bonus Raids", () => {
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map()}
        bonusEntries={[
          { ...entry(b1, 1), resourceId: "fast" as never },
          { ...entry(b2, 1), resourceId: "slow" as never },
        ]}
        bonusLabel="Bonus raids"
        entries={[]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([
            [b1, location("B1", "Indomitus", "Elite 4")],
            [b2, location("B2", "Fall of Cadia", "Standard 7")],
          ])
        }
        resourceLabels={new Map()}
        resourceProgress={new Map()}
        resourceUrgencyByGoalAndResource={
          new Map([
            ["g1:fast", { days: 1, energyTotal: 6 }],
            ["g1:slow", { days: 3, energyTotal: 18 }],
          ])
        }
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    const bonusIds = [
      ...screen
        .getByTestId("raid-resource-grid-g1")
        .querySelectorAll<HTMLElement>("[data-testid^='raid-card-g1-']"),
    ].map((element) => element.dataset.testid?.replace("raid-card-g1-", ""))
    expect(bonusIds).toEqual(["slow", "fast"])
  })

  it("keeps higher-priority goal groups first", () => {
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map()}
        entries={[
          { ...entry(b2, 1), goalId: "g2", resourceId: "lower" as never },
          { ...entry(b1, 1), goalId: "g1", resourceId: "higher" as never },
        ]}
        goalsById={
          new Map([
            ["g1", goal],
            ["g2", bonusGoal],
          ])
        }
        locationsByBattleId={
          new Map([
            [b1, location("B1", "Indomitus", "Elite 4")],
            [b2, location("B2", "Fall of Cadia", "Standard 7")],
          ])
        }
        resourceLabels={new Map()}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    const resourceGridIds = [
      ...screen
        .getByTestId("schedule")
        .querySelectorAll<HTMLElement>("[data-testid^='raid-resource-grid-']"),
    ].map((element) => element.dataset.testid)
    expect(resourceGridIds).toEqual([
      "raid-resource-grid-g1",
      "raid-resource-grid-g2",
    ])
  })

  it("names a campaign's lone battle in full on its row, with no group header", () => {
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map([[b1, 3]])}
        emphasis="location"
        entries={[entry(b1, 3)]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([[b1, location("B1", "Indomitus", "Elite 4", "Elite")]])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    expect(
      screen.queryByRole("heading", { level: 3, name: "Indomitus Elite" })
    ).not.toBeInTheDocument()
    expect(screen.getByTestId(`raid-location-${b1}`)).toHaveTextContent(
      "Indomitus Elite 4"
    )
    expect(screen.getByTestId(`raid-location-${b1}`)).not.toHaveTextContent(
      "Battle"
    )
  })

  it("omits the tier-and-node line for a battle the catalog has no descriptor for", () => {
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map([[b1, 3]])}
        emphasis="location"
        entries={[entry(b1, 3)]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={new Map([[b1, location("B1", "B1", "")]])}
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    const lines = screen
      .getByTestId(`raid-location-${b1}`)
      .querySelectorAll(".wrap-break-word")
    expect([...lines].map((line) => line.textContent)).toEqual(["B1"])
  })

  it("wraps a long localized campaign name and node label in full instead of truncating them", () => {
    const campaignName = "Adeptus Mechanicus – Kampagnenereignis"
    const nodeLabel = "Extremis 12B (Herausforderungsknoten)"
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map([[b1, 3]])}
        emphasis="location"
        entries={[entry(b1, 3)]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([[b1, location("B1", campaignName, nodeLabel, "Extremis")]])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    // A lone battle names its campaign, tier and node on its row, wrapping instead of truncating.
    const line = screen
      .getByTestId(`raid-location-${b1}`)
      .querySelector(".wrap-break-word")
    expect(line).toHaveTextContent(`${campaignName} ${nodeLabel}`)
    expect(line).not.toHaveClass("truncate")
  })

  it("names the resource by its icon, shows the name in a tooltip on hover, and keeps progress beside it", async () => {
    const user = userEvent.setup()
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map([[b1, 3]])}
        emphasis="location"
        entries={[entry(b1, 3)]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([[b1, location("B1", "Indomitus", "Elite 4")]])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map([["g1:upgrade1", { owned: 5, target: 10 }]])}
        resourceVisuals={
          new Map([
            [
              "upgrade1",
              {
                kind: "upgrade" as const,
                id: "upgrade1" as never,
                rarity: "Common" as never,
                crafted: false,
              },
            ],
          ])
        }
        testId="schedule"
      />
    )

    // Named by the icon's button before the tooltip opens.
    expect(screen.getByRole("button", { name: "Ceramite" })).toBeInTheDocument()
    expect(screen.getByText("5/10")).toBeInTheDocument()

    await user.hover(screen.getByTestId("raid-resource-icon"))
    expect(await screen.findAllByText("Ceramite")).not.toHaveLength(0)
  })

  it("renders one full-weight row per location when a resource is farmed at more than one node", () => {
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map()}
        emphasis="location"
        entries={[entry(b1, 2), entry(b2, 1)]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([
            [b1, location("B1", "Indomitus", "Elite 4")],
            [b2, location("B2", "Fall of Cadia", "Standard 7")],
          ])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    expect(screen.getByTestId(`raid-location-${b1}`)).toBeInTheDocument()
    expect(screen.getByTestId(`raid-location-${b2}`)).toBeInTheDocument()
  })

  it("shows nothing when the planned raid count reaches the node's daily cap", () => {
    render(
      <RaidSchedule
        attemptsLeftByBattle={new Map([[b1, 4]])}
        attemptsUsedByBattle={new Map()}
        emphasis="location"
        entries={[{ ...entry(b1, 6, 6), remainingBefore: 9 }]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([[b1, location("B1", "Octarius", "Elite 1")]])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    const row = screen.getByTestId(`raid-location-${b1}`)
    expect(row).not.toHaveTextContent(/upgrades? left/)
    expect(row).not.toHaveTextContent(/attempts? used/)
  })

  it("shows the upgrades still needed when the plan stops below the node's daily cap", () => {
    render(
      <RaidSchedule
        attemptsLeftByBattle={new Map([[b1, 4]])}
        attemptsUsedByBattle={new Map()}
        emphasis="location"
        entries={[{ ...entry(b1, 3, 6), remainingBefore: 2.4 }]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([[b1, location("B1", "Octarius", "Elite 1")]])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    const row = screen.getByTestId(`raid-location-${b1}`)
    expect(row).toHaveTextContent("3 upgrades left")
    expect(row).not.toHaveTextContent(/attempts? used/)
    // Short visible form so the name keeps the row width on mobile; full wording stays for AT.
    expect(within(row).getByText("3 still needed")).toHaveAttribute(
      "aria-hidden"
    )
    expect(within(row).getByText("3 upgrades left")).toHaveClass("sr-only")
  })

  it("shows a later location the goal's whole need, not what is left after an earlier location's expected drops", () => {
    // Needs 3: B1 is raided out (3 attempts, expected 1.2 drops), leaving 1.8 for B2 in the plan.
    render(
      <RaidSchedule
        attemptsLeftByBattle={
          new Map([
            [b1, 3],
            [b2, 5],
          ])
        }
        attemptsUsedByBattle={new Map()}
        emphasis="location"
        entries={[
          { ...entry(b1, 3, 3), itemsFarmed: 1.2, remainingBefore: 3 },
          { ...entry(b2, 3, 5), itemsFarmed: 1.8, remainingBefore: 1.8 },
        ]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([
            [b1, location("B1", "Saim-Hann Mirror", "Elite 38")],
            [b2, location("B2", "Saim-Hann Mirror", "Elite 7")],
          ])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    expect(screen.getByTestId(`raid-location-${b1}`)).not.toHaveTextContent(
      /still needed/
    )
    expect(
      within(screen.getByTestId(`raid-location-${b2}`)).getByText(
        "3 still needed"
      )
    ).toBeInTheDocument()
  })

  it("shows no still-needed badge when the card already shows owned / target", () => {
    render(
      <RaidSchedule
        attemptsLeftByBattle={
          new Map([
            [b1, 3],
            [b2, 5],
          ])
        }
        attemptsUsedByBattle={new Map()}
        emphasis="location"
        entries={[
          { ...entry(b1, 3, 3), itemsFarmed: 1.2, remainingBefore: 12 },
          { ...entry(b2, 3, 5), itemsFarmed: 1.8, remainingBefore: 10.8 },
        ]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([
            [b1, location("B1", "Fall of Cadia", "Elite 12")],
            [b2, location("B2", "Saim-Hann Mirror", "Elite 1")],
          ])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={
          new Map([
            [dailyRaidResourceKey("g1", "upgrade1"), { owned: 0, target: 12 }],
          ])
        }
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    // Each row of the upgrade shows what the player holds of it.
    expect(screen.getAllByText("0/12")).toHaveLength(2)
    expect(screen.getByTestId("schedule")).not.toHaveTextContent(
      /still needed|upgrades? left/
    )
  })

  it("excludes a fully-raided location from the card but keeps the card for its other locations", () => {
    render(
      <RaidSchedule
        attemptsLeftByBattle={
          new Map([
            [b1, 0],
            [b2, 5],
          ])
        }
        attemptsUsedByBattle={
          new Map([
            [b1, 10],
            [b2, 1],
          ])
        }
        emphasis="location"
        entries={[entry(b1, 10, 10), entry(b2, 1, 10)]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([
            [b1, location("B1", "Indomitus", "Elite 4")],
            [b2, location("B2", "Fall of Cadia", "Standard 7")],
          ])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    expect(screen.queryByTestId(`raid-location-${b1}`)).not.toBeInTheDocument()
    expect(screen.getByTestId(`raid-location-${b2}`)).toBeInTheDocument()
  })

  it("omits the whole card when every one of its locations is fully raided", () => {
    render(
      <RaidSchedule
        attemptsLeftByBattle={new Map([[b1, 0]])}
        attemptsUsedByBattle={new Map([[b1, 10]])}
        emphasis="location"
        entries={[entry(b1, 10, 10)]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([[b1, location("B1", "Indomitus", "Elite 4")]])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    expect(screen.queryByText("Indomitus Elite")).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("raid-card-g1-upgrade1")
    ).not.toBeInTheDocument()
  })

  it("skips the whole goal section when every one of its resources is fully de-duped away", () => {
    // Two distinct resources (not just two locations for one resource) so a per-card check alone
    // — each ResourceCard independently returning null — couldn't explain an absent section: the
    // goal header and the (otherwise still-rendered, just empty) resource grid would remain unless
    // RaidSchedule's own group-level visibility check skips the section.
    render(
      <RaidSchedule
        attemptsLeftByBattle={
          new Map([
            [b1, 0],
            [b2, 0],
          ])
        }
        attemptsUsedByBattle={new Map()}
        emphasis="location"
        entries={[
          entry(b1, 10, 10),
          { ...entry(b2, 8, 8), resourceId: "upgrade2" as never },
        ]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([
            [b1, location("B1", "Indomitus", "Elite 4")],
            [b2, location("B2", "Fall of Cadia", "Standard 7")],
          ])
        }
        resourceLabels={
          new Map([
            ["upgrade1", "Ceramite"],
            ["upgrade2", "Plasteel"],
          ])
        }
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    expect(screen.queryByText("Hero One")).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("raid-resource-grid-g1")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("raid-card-g1-upgrade1")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("raid-card-g1-upgrade2")
    ).not.toBeInTheDocument()
  })

  it("renders bonusEntries as goal groups in the same schedule, with a heading marking where they start", () => {
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map()}
        bonusEntries={[bonusEntry(b2, 2)]}
        bonusLabel="Bonus raids"
        emphasis="location"
        entries={[entry(b1, 3)]}
        goalsById={
          new Map([
            ["g1", goal],
            ["g2", bonusGoal],
          ])
        }
        locationsByBattleId={
          new Map([
            [b1, location("B1", "Indomitus", "Elite 4")],
            [b2, location("B2", "Fall of Cadia", "Standard 7")],
          ])
        }
        resourceLabels={
          new Map([
            ["upgrade1", "Ceramite"],
            ["upgrade2", "Plasteel"],
          ])
        }
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    expect(screen.getByTestId("bonus-raids-heading")).toHaveTextContent(
      "Bonus raids"
    )
    expect(screen.getByTestId("raid-resource-grid-g1")).toBeInTheDocument()
    expect(screen.getByTestId("raid-resource-grid-g2")).toBeInTheDocument()
    // Both goal groups are flow items of the same container (not two separate schedules).
    expect(screen.getAllByTestId("schedule")).toHaveLength(1)
    expect(screen.getByTestId("schedule")).toContainElement(
      screen.getByTestId("raid-resource-grid-g2")
    )
  })

  it("shows no bonus heading when there are no bonus entries", () => {
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map()}
        bonusEntries={[]}
        bonusLabel="Bonus raids"
        emphasis="location"
        entries={[entry(b1, 3)]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([[b1, location("B1", "Indomitus", "Elite 4")]])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    expect(screen.queryByTestId("bonus-raids-heading")).not.toBeInTheDocument()
  })
})

describe("RaidSchedule card layout", () => {
  function renderLayout() {
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map()}
        emphasis="location"
        entries={[entry(b1, 3), entry(b2, 2)]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([
            [b1, location("B1", "Indomitus", "Elite 4")],
            [b2, location("B2", "Indomitus", "Elite 5")],
          ])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )
  }

  it("spreads one goal group's cards over 20rem columns, never wider than the group", () => {
    renderLayout()

    expect(screen.getByTestId("schedule").className).not.toMatch(/columns-/)
    expect(screen.getByTestId("raid-resource-grid-g1")).toHaveClass(
      "md:grid-cols-[repeat(auto-fill,minmax(min(20rem,100%),1fr))]"
    )
  })
})
