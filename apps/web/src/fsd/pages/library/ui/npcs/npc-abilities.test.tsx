import { describe, expect, it, vi } from "vitest"

import userEvent from "@testing-library/user-event"

import { render, screen } from "@/test/render"

// Only these ids have a name; `RunsAway` stands in for an internal marker the game never names.
const names: Record<string, string> = {
  AdaptiveStrategy: "Adaptive Strategy",
  RelentlessMarch: "Relentless March",
  ArcScourge: "Arc Scourge",
}

const abilityText = {
  AdaptiveStrategy: {
    description: "Deals {[minDmg]}-{[maxDmg]} Damage per hit.",
    variables: { minDmg: [12, 14, 17], maxDmg: [16, 19, 22] },
    constants: {},
    scaled: [],
  },
}

vi.mock("@/entities/npc", () => ({
  useNpcAbilityText: () => (id: string) =>
    abilityText[id as keyof typeof abilityText],
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => names[key] ?? (names[key.slice(10)] || key),
    i18n: { exists: (key: string) => names[key.slice(10)] !== undefined },
  }),
}))

import { NpcAbilities } from "./npc-abilities"

describe("NpcAbilities", () => {
  it("lists active and passive abilities with their icons", () => {
    render(
      <NpcAbilities
        abilityLevel={2}
        unitName="Makhotep"
        rarity="Common"
        activeAbilities={["AdaptiveStrategy"]}
        passiveAbilities={["RelentlessMarch"]}
      />
    )

    const active = screen.getByTestId("npc-abilities-active")
    expect(active).toHaveTextContent("Adaptive Strategy")
    expect(
      screen.getByTestId("npc-ability-AdaptiveStrategy").querySelector("img")
    ).toHaveAttribute(
      "src",
      "/game_catalog/abilities/ui_icon_ability2_AdaptiveStrategy.png"
    )

    expect(screen.getByTestId("npc-abilities-passive")).toHaveTextContent(
      "Relentless March"
    )
  })

  it("places active and passive in a two-column grid on desktop and stacks on mobile", () => {
    const { rerender } = render(
      <NpcAbilities
        abilityLevel={2}
        unitName="Makhotep"
        rarity="Common"
        activeAbilities={["AdaptiveStrategy"]}
        passiveAbilities={["RelentlessMarch"]}
      />
    )
    const grid = () => screen.getByTestId("npc-abilities").querySelector("div")!
    expect(grid().className).toContain("grid-cols-2")

    rerender(
      <NpcAbilities
        abilityLevel={2}
        unitName="Makhotep"
        rarity="Common"
        activeAbilities={["AdaptiveStrategy"]}
        passiveAbilities={["RelentlessMarch"]}
        compact
      />
    )
    expect(grid().className).toContain("grid-cols-1")
  })

  it("labels each column once rather than each chip", () => {
    render(
      <NpcAbilities
        abilityLevel={2}
        unitName="Makhotep"
        rarity="Common"
        activeAbilities={["AdaptiveStrategy", "ArcScourge"]}
        passiveAbilities={["RelentlessMarch"]}
      />
    )

    const active = screen.getByTestId("npc-abilities-active")
    expect(active.querySelectorAll("li")).toHaveLength(2)
    expect(active.querySelectorAll("h4")).toHaveLength(1)
  })

  it("expands an ability that has resolvable rules text, scaled to the level", async () => {
    const user = userEvent.setup()
    render(
      <NpcAbilities
        abilityLevel={2}
        unitName="Makhotep"
        rarity="Common"
        activeAbilities={["AdaptiveStrategy"]}
        passiveAbilities={["RelentlessMarch"]}
      />
    )

    const toggle = screen.getByRole("button", { name: /Adaptive Strategy/ })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText(/Damage per hit/)).toBeNull()

    await user.click(toggle)

    expect(toggle).toHaveAttribute("aria-expanded", "true")
    // level 2 -> variables[1]
    expect(
      screen.getByTestId("npc-ability-AdaptiveStrategy")
    ).toHaveTextContent("14")
    expect(
      screen.getByTestId("npc-ability-AdaptiveStrategy")
    ).toHaveTextContent("19")
  })

  it("renders an ability with no resolvable text as a plain chip", () => {
    render(
      <NpcAbilities
        abilityLevel={2}
        unitName="Makhotep"
        rarity="Common"
        activeAbilities={[]}
        passiveAbilities={["RelentlessMarch"]}
      />
    )

    expect(
      screen.queryByRole("button", { name: /Relentless March/ })
    ).toBeNull()
    expect(screen.getByTestId("npc-ability-RelentlessMarch")).toHaveTextContent(
      "Relentless March"
    )
  })

  it("omits a group that has no named abilities", () => {
    render(
      <NpcAbilities
        abilityLevel={2}
        unitName="Makhotep"
        rarity="Common"
        activeAbilities={[]}
        passiveAbilities={["ArcScourge"]}
      />
    )

    expect(screen.queryByTestId("npc-abilities-active")).toBeNull()
    expect(screen.getByTestId("npc-abilities-passive")).toBeVisible()
  })

  it("renders nothing when the variation has no abilities", () => {
    render(
      <NpcAbilities
        abilityLevel={2}
        unitName="Makhotep"
        rarity="Common"
        activeAbilities={[]}
        passiveAbilities={[]}
      />
    )

    expect(screen.queryByTestId("npc-abilities")).toBeNull()
  })

  it("drops an unnamed internal ability rather than showing its raw id", () => {
    render(
      <NpcAbilities
        abilityLevel={2}
        unitName="Makhotep"
        rarity="Common"
        activeAbilities={["RunsAway", "AdaptiveStrategy"]}
        passiveAbilities={["BossEndFightUndefeated"]}
      />
    )

    expect(screen.queryByText("RunsAway")).toBeNull()
    expect(screen.queryByText("BossEndFightUndefeated")).toBeNull()
    expect(screen.queryByTestId("npc-abilities-passive")).toBeNull()
    expect(screen.getByTestId("npc-abilities-active")).toHaveTextContent(
      "Adaptive Strategy"
    )
  })

  it("renders nothing when every ability is unnamed", () => {
    render(
      <NpcAbilities
        abilityLevel={2}
        unitName="Makhotep"
        rarity="Common"
        activeAbilities={["RunsAway"]}
        passiveAbilities={["RunsAround"]}
      />
    )

    expect(screen.queryByTestId("npc-abilities")).toBeNull()
  })
})
