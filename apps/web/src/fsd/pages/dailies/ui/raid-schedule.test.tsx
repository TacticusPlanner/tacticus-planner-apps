import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { battleIdSchema } from "@workspace/game-domain"

import { render, screen } from "@/test/render"

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}))

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

const location = (id: string, fullName: string, nodeNumber: number) => ({
  id,
  fullName,
  shortLabel: `${fullName} ${nodeNumber}`,
  nodeNumber,
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
  }
}

describe("RaidSchedule location emphasis", () => {
  it("renders the full campaign name and battle number as the card's primary content", () => {
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map([[b1, 3]])}
        emphasis="location"
        entries={[entry(b1, 3)]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([[b1, location("B1", "Indomitus Elite", 4)]])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    expect(screen.getByText("Indomitus Elite")).toBeInTheDocument()
    expect(screen.getByText('schedule.battle:{"number":4}')).toBeInTheDocument()
  })

  it("keeps the resource name accessible (sr-only) by default and shows it in a visible tooltip on hover, while keeping progress visible underneath", async () => {
    const user = userEvent.setup()
    render(
      <RaidSchedule
        attemptsUsedByBattle={new Map([[b1, 3]])}
        emphasis="location"
        entries={[entry(b1, 3)]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([[b1, location("B1", "Indomitus Elite", 4)]])
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

    // Visually hidden (sr-only) but still accessible before the tooltip opens.
    expect(screen.getAllByText("Ceramite")).toHaveLength(1)
    expect(screen.getByText("5 / 10")).toBeInTheDocument()

    await user.hover(screen.getByTestId("raid-resource-icon"))
    expect((await screen.findAllByText("Ceramite")).length).toBeGreaterThan(1)
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
            [b1, location("B1", "Indomitus Elite", 4)],
            [b2, location("B2", "Fall of Cadia Standard", 7)],
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

  it("shows Max raids when the planned raid count itself equals the node's daily cap", () => {
    render(
      <RaidSchedule
        attemptsLeftByBattle={new Map([[b1, 4]])}
        attemptsUsedByBattle={new Map()}
        emphasis="location"
        entries={[entry(b1, 6, 6)]}
        goalsById={new Map([["g1", goal]])}
        locationsByBattleId={
          new Map([[b1, location("B1", "Octarius Elite", 1)]])
        }
        resourceLabels={new Map([["upgrade1", "Ceramite"]])}
        resourceProgress={new Map()}
        resourceVisuals={new Map()}
        testId="schedule"
      />
    )

    expect(screen.getByTestId(`raid-location-${b1}`)).toHaveTextContent(
      "schedule.maxRaids"
    )
    expect(
      screen.queryByText('schedule.raids:{"count":6}')
    ).not.toBeInTheDocument()
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
            [b1, location("B1", "Indomitus Elite", 4)],
            [b2, location("B2", "Fall of Cadia Standard", 7)],
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
          new Map([[b1, location("B1", "Indomitus Elite", 4)]])
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
            [b1, location("B1", "Indomitus Elite", 4)],
            [b2, location("B2", "Fall of Cadia Standard", 7)],
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
            [b1, location("B1", "Indomitus Elite", 4)],
            [b2, location("B2", "Fall of Cadia Standard", 7)],
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
    // Both goal groups are flow items of the same masonry container (not two separate schedules).
    expect(screen.getByTestId("schedule")).toHaveClass("md:columns-[20rem]")
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
          new Map([[b1, location("B1", "Indomitus Elite", 4)]])
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
