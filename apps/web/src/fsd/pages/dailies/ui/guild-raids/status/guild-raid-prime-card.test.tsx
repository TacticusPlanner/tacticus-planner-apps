import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { GuildRaidPrimeView } from "../guild-raid-status-view-model"
import { GuildRaidPrimeCard } from "./guild-raid-prime-card"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: "en" },
  }),
}))

function prime(
  overrides: Partial<GuildRaidPrimeView> = {}
): GuildRaidPrimeView {
  return {
    encounterIndex: 1,
    unitSetId: "GuildBoss4MiniBoss1OrksBigMek",
    name: "Gibbascrapz",
    portraitSrc: undefined,
    hp: { kind: "known", remaining: 200, max: 800 },
    modifiers: [
      {
        modifierId: "mod-1",
        description: { kind: "amount", text: "−10% armor" },
        activation: { kind: "known", remainingHp: 10500, active: true },
      },
      {
        modifierId: "mod-2",
        description: { kind: "amount", text: "−15% damage" },
        activation: { kind: "known", remainingHp: 9000, active: false },
      },
      {
        modifierId: "mod-3",
        description: { kind: "amount", text: "−25% damage" },
        activation: { kind: "known", remainingHp: 3000, active: false },
      },
    ],
    ...overrides,
  }
}

describe("GuildRaidPrimeCard", () => {
  it("renders the name, position label, and HP", () => {
    render(
      <GuildRaidPrimeCard isMobile={false} position="left" prime={prime()} />
    )

    expect(screen.getByText("Gibbascrapz")).toBeInTheDocument()
    expect(
      screen.getByText("guildRaids.status.primeLeftLabel")
    ).toBeInTheDocument()
    expect(screen.getByTestId("guild-raid-prime-hp")).toHaveTextContent(
      'guildRaids.status.hp:{"remaining":200,"max":800}'
    )
  })

  it("shows only the next not-yet-confirmed modifier by default, not the already-active or later ones", () => {
    render(
      <GuildRaidPrimeCard isMobile={false} position="left" prime={prime()} />
    )

    const trigger = screen.getByTestId("guild-raid-next-modifier-trigger")
    expect(trigger).toHaveTextContent("−15% damage")
    expect(trigger).not.toHaveTextContent("−10% armor")
    expect(trigger).not.toHaveTextContent("−25% damage")
    expect(screen.getByTestId("guild-raid-modifiers-count")).toHaveTextContent(
      'guildRaids.status.modifiersHit:{"active":1,"total":3}'
    )
  })

  it("falls back to an all-active message once every modifier is confirmed active", () => {
    render(
      <GuildRaidPrimeCard
        isMobile={false}
        position="left"
        prime={prime({
          modifiers: [
            {
              modifierId: "mod-1",
              description: { kind: "amount", text: "−10% armor" },
              activation: { kind: "known", remainingHp: 10500, active: true },
            },
          ],
        })}
      />
    )

    expect(
      screen.getByTestId("guild-raid-next-modifier-trigger")
    ).toHaveTextContent("guildRaids.status.modifiersAllActive")
  })

  it("opens a dialog with every modifier when the collapsed row is clicked", async () => {
    const user = userEvent.setup()
    render(
      <GuildRaidPrimeCard isMobile={false} position="right" prime={prime()} />
    )

    await user.click(screen.getByTestId("guild-raid-next-modifier-trigger"))

    const dialog = await screen.findByTestId("guild-raid-modifiers-dialog")
    expect(dialog).toHaveTextContent("−10% armor")
    expect(dialog).toHaveTextContent("−15% damage")
    expect(dialog).toHaveTextContent("−25% damage")
    expect(within(dialog).getAllByTestId("guild-raid-modifier")).toHaveLength(3)
  })

  it("renders no modifiers section when the prime has none", () => {
    render(
      <GuildRaidPrimeCard
        isMobile={false}
        position="left"
        prime={prime({ modifiers: [] })}
      />
    )

    expect(
      screen.queryByTestId("guild-raid-next-modifier-trigger")
    ).not.toBeInTheDocument()
  })

  it("still renders name, position, HP, and the modifiers trigger in the compact mobile layout", () => {
    render(
      <GuildRaidPrimeCard isMobile={true} position="right" prime={prime()} />
    )

    expect(screen.getByText("Gibbascrapz")).toBeInTheDocument()
    expect(
      screen.getByText("guildRaids.status.primeRightLabel")
    ).toBeInTheDocument()
    expect(screen.getByTestId("guild-raid-prime-hp")).toBeInTheDocument()
    expect(
      screen.getByTestId("guild-raid-next-modifier-trigger")
    ).toBeInTheDocument()
  })
})
