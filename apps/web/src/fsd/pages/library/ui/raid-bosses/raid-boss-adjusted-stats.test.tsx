import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key} ${JSON.stringify(opts)}` : key,
  }),
}))

const { RaidBossAdjustedStats } = await import("./raid-boss-adjusted-stats")
import type { AdjustedStatsView, RaidBoss } from "@/entities/raid-boss"

const unit = {
  unitSetId: "boss",
  kind: "boss",
  movement: 4,
} as unknown as RaidBoss
const step = {
  health: 500,
  damage: 100,
  fixedArmor: 20,
  abilityLevel: 10,
} as never

const view: AdjustedStatsView = {
  primes: [
    {
      id: "1",
      unitSetId: "prime-a",
      totalHp: 3000,
      scaledModifiers: [],
      hpLostPoints: [0, 1500, 3000],
    },
  ],
  activeModifiers: [
    {
      hpLost: 1500,
      modifierId: "m",
      type: "bossStatPctDecrease",
      target: "dmg",
      amount: 40,
    },
  ] as never,
  statAdjustments: { pctByStat: { dmg: -40 }, flatByStat: {} },
  enemies: { ids: ["grot"], removed: [{ unitSetId: "ripper", count: 2 }] },
}

const baseProps = {
  unit,
  step,
  view,
  hpLostByPrime: { "1": 1500 },
  onHpLostChange: vi.fn(),
  primeLabels: { "1": "Warrior" },
  enemyNames: ["Grot"],
  removed: [{ name: "Ripper Swarm", count: 2 }],
}

describe("RaidBossAdjustedStats", () => {
  it("shows base and adjusted stat columns on desktop", () => {
    render(<RaidBossAdjustedStats {...baseProps} />)
    const panel = screen.getByTestId("raid-boss-adjusted-stats")
    expect(panel).toHaveTextContent("raidBosses.baseColumn")
    expect(panel).toHaveTextContent("raidBosses.adjustedColumn")
    // damage 100, -40% -> 60
    expect(within(panel).getByText("100")).toBeInTheDocument()
    expect(within(panel).getByText("60")).toBeInTheDocument()
    // removed-enemy note
    expect(panel).toHaveTextContent(
      'raidBosses.enemyRemoved {"count":2,"name":"Ripper Swarm"}'
    )
  })

  it("shows the full stat set (Health/Damage/Armor/Movement) with only Damage adjusted", () => {
    render(<RaidBossAdjustedStats {...baseProps} />)

    // Health (base 500, untouched by the dmg-only modifier) -> base === adjusted
    const healthRow = screen.getByText("raidBosses.health").closest("tr")!
    expect(within(healthRow).getAllByText("500")).toHaveLength(2)

    // Damage (base 100, -40% modifier active) -> base !== adjusted
    const damageRow = screen.getByText("raidBosses.damage").closest("tr")!
    expect(within(damageRow).getByText("100")).toBeInTheDocument()
    expect(within(damageRow).getByText("60")).toBeInTheDocument()

    // Armor (base 20, untouched) -> base === adjusted
    const armorRow = screen.getByText("raidBosses.armor").closest("tr")!
    expect(within(armorRow).getAllByText("20")).toHaveLength(2)

    // Movement (base 4, untouched) -> base === adjusted
    const movementRow = screen.getByText("raidBosses.movement").closest("tr")!
    expect(within(movementRow).getAllByText("4")).toHaveLength(2)
  })

  it("hides the adjusted column on mobile until toggled", async () => {
    const user = userEvent.setup()
    render(<RaidBossAdjustedStats {...baseProps} compact />)
    const panel = screen.getByTestId("raid-boss-adjusted-stats")

    expect(panel).not.toHaveTextContent("raidBosses.adjustedColumn")
    expect(within(panel).queryByText("60")).not.toBeInTheDocument()

    await user.click(
      within(panel).getByRole("button", { name: "raidBosses.showAdjusted" })
    )
    expect(panel).toHaveTextContent("raidBosses.adjustedColumn")
    expect(within(panel).getByText("60")).toBeInTheDocument()
  })

  it("labels the HP-lost options as percentages, consistent with the Prime Modifiers panel", async () => {
    const user = userEvent.setup()
    const percentView: AdjustedStatsView = {
      ...view,
      primes: [
        {
          id: "1",
          unitSetId: "prime-a",
          totalHp: 8000,
          scaledModifiers: [],
          // 0 (full HP) + 8 thresholds -> same k/(N) schedule as `ModifierRows`'
          // `round(100 * (index + 1) / total)` over an 8-modifier list.
          hpLostPoints: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000],
        },
      ],
    }
    render(<RaidBossAdjustedStats {...baseProps} view={percentView} />)

    await user.click(screen.getAllByRole("combobox")[0])
    expect(
      screen.getByRole("option", { name: "raidBosses.fullHp" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("option", {
        name: 'raidBosses.hpLostPercent {"hpLost":13}',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("option", {
        name: 'raidBosses.hpLostPercent {"hpLost":100}',
      })
    ).toBeInTheDocument()
  })

  it("shows a no-modifiers message when nothing is active", () => {
    render(
      <RaidBossAdjustedStats
        {...baseProps}
        view={{
          ...view,
          activeModifiers: [],
          statAdjustments: { pctByStat: {}, flatByStat: {} },
          enemies: { ids: ["grot"], removed: [] },
        }}
        removed={[]}
      />
    )
    expect(screen.getByTestId("raid-boss-adjusted-stats")).toHaveTextContent(
      "raidBosses.noActiveModifiers"
    )
  })
})
