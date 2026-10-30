import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type {
  GuildRaidExactReadinessRecommendationView,
  GuildRaidExactReadinessSlotView,
  GuildRaidExactReadinessUnitView,
} from "@/entities/guild-raid-meta"

import { GuildRaidExactMetaCard } from "./guild-raid-exact-meta-card"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: "en" },
  }),
}))

function unit(
  id: string,
  owned: boolean | undefined,
  kind: "character" | "mow" = "character"
): GuildRaidExactReadinessUnitView {
  const name = id.replace(/^\w/, (letter) => letter.toUpperCase())
  return owned === undefined ? { id, name, kind } : { id, name, kind, owned }
}

const signature: GuildRaidExactReadinessSlotView = {
  kind: "hero",
  role: { id: "signature", label: "Signature" },
  essential: true,
  ideal: unit("bladeChampion", true),
  picked: unit("bladeChampion", true),
  isSubstitute: false,
  readiness: 90,
  options: [
    {
      unit: unit("bladeChampion", true),
      isIdeal: true,
      state: "picked",
      readiness: 90,
    },
  ],
}

const coreWithSubstitute: GuildRaidExactReadinessSlotView = {
  kind: "hero",
  role: { id: "core", label: "Core" },
  essential: true,
  ideal: unit("trajann", false),
  picked: unit("dante", true),
  isSubstitute: true,
  readiness: 60,
  options: [
    { unit: unit("trajann", false), isIdeal: true, state: "notOwned" },
    {
      unit: unit("blackmane", true),
      isIdeal: false,
      state: "inTeam",
      inTeamSlotIndex: 2,
      readiness: 80,
    },
    {
      unit: unit("dante", true),
      isIdeal: false,
      state: "picked",
      readiness: 60,
    },
  ],
}

const flex: GuildRaidExactReadinessSlotView = {
  kind: "hero",
  role: { id: "flex", label: "Flex" },
  essential: false,
  ideal: unit("blackmane", true),
  picked: unit("blackmane", true),
  isSubstitute: false,
  readiness: 80,
  options: [],
}

const emptyFlex: GuildRaidExactReadinessSlotView = {
  kind: "hero",
  role: { id: "flex", label: "Flex" },
  essential: false,
  ideal: unit("helbrecht", false),
  picked: null,
  isSubstitute: false,
  readiness: 0,
  options: [
    { unit: unit("helbrecht", false), isIdeal: true, state: "notOwned" },
    { unit: unit("dante", true), isIdeal: false, state: "inTeam" },
  ],
}

const mow: GuildRaidExactReadinessSlotView = {
  kind: "mow",
  essential: false,
  ideal: unit("galatian", false, "mow"),
  picked: unit("biovore", true, "mow"),
  isSubstitute: true,
  readiness: 60,
  options: [],
}

function recommendation(
  overrides: Partial<GuildRaidExactReadinessRecommendationView> = {}
): GuildRaidExactReadinessRecommendationView {
  return {
    id: "rec-1",
    kind: { id: "alternate", label: "Alternate" },
    efficiency: 1.3,
    comps: [
      {
        id: "Custodes",
        signature: { id: "bladeChampion", name: "Blade", kind: "character" },
      },
    ],
    status: "substitutes",
    teamReadiness: 69,
    slots: [signature, coreWithSubstitute, flex, emptyFlex, mow],
    ...overrides,
  }
}

describe("GuildRaidExactMetaCard", () => {
  it.each([false, true])(
    "shows the lineup status, team readiness and efficiency (mobile: %s)",
    (isMobile) => {
      render(
        <GuildRaidExactMetaCard
          isMobile={isMobile}
          recommendation={recommendation()}
        />
      )

      expect(
        screen.getByTestId("guild-raid-exact-meta-status")
      ).toHaveTextContent("guildRaids.exactMeta.status.substitutes")
      expect(
        screen.getByTestId("guild-raid-exact-meta-team-readiness")
      ).toHaveTextContent('guildRaids.exactMeta.teamReadiness:{"percent":69}')
      expect(
        screen.getByText('guildRaids.exactMeta.efficiency:{"value":1.3}')
      ).toBeInTheDocument()
      expect(
        screen.getByText('guildRaids.exactMeta.comp:{"name":"Custodes"}')
      ).toBeInTheDocument()
    }
  )

  it("shows the hero you'd field, by name, with the readiness of that hero and who it stands in for", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation()}
      />
    )

    const slot = screen.getByTestId("guild-raid-exact-meta-slot-1")
    expect(slot).toHaveTextContent("Core")
    expect(slot).toHaveTextContent("Dante")
    expect(slot).toHaveTextContent(
      'guildRaids.exactMeta.forIdeal:{"name":"Trajann"}'
    )
    expect(slot).toHaveTextContent("60%")
    expect(slot).not.toHaveTextContent("trajann")

    const mowSlot = screen.getByTestId("guild-raid-exact-meta-slot-4")
    expect(mowSlot).toHaveTextContent("guildRaids.exactMeta.mow")
    expect(mowSlot).toHaveTextContent("Biovore")
  })

  it("explains an empty slot instead of showing a percentage for an unowned hero", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation()}
      />
    )

    const slot = screen.getByTestId("guild-raid-exact-meta-slot-3")
    expect(slot).toHaveTextContent("Helbrecht")
    expect(slot).toHaveTextContent("guildRaids.exactMeta.noFreeOption")
    expect(slot).toHaveTextContent("0%")
  })

  it.each([false, true])(
    "lists every option for a slot, with why it was or wasn't picked (mobile: %s)",
    async (isMobile) => {
      const user = userEvent.setup()
      render(
        <GuildRaidExactMetaCard
          isMobile={isMobile}
          recommendation={recommendation()}
        />
      )

      expect(
        screen.queryByTestId("guild-raid-exact-meta-options")
      ).not.toBeInTheDocument()

      const slot = screen.getByTestId("guild-raid-exact-meta-slot-1")
      await user.click(slot)
      expect(slot).toHaveAttribute("aria-expanded", "true")

      const panel = screen.getByRole("region", {
        name: 'guildRaids.exactMeta.slotOptions:{"slot":"Core"}',
      })
      const rows = within(panel).getAllByRole("listitem")
      expect(rows.map((row) => row.textContent)).toEqual([
        expect.stringContaining("Trajann"),
        expect.stringContaining("Blackmane"),
        expect.stringContaining("Dante"),
      ])
      expect(rows[0]).toHaveTextContent("guildRaids.exactMeta.ideal")
      expect(rows[0]).toHaveTextContent(
        "guildRaids.exactMeta.optionState.notOwned"
      )
      expect(rows[1]).toHaveTextContent(
        'guildRaids.exactMeta.optionState.inTeam:{"slot":"Flex"}'
      )
      expect(rows[1]).toHaveTextContent("80%")
      expect(rows[2]).toHaveTextContent(
        "guildRaids.exactMeta.optionState.picked"
      )

      await user.click(slot)
      expect(
        screen.queryByTestId("guild-raid-exact-meta-options")
      ).not.toBeInTheDocument()
    }
  )

  it("shows picks without percentages or status when readiness is withheld", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation({
          status: undefined,
          teamReadiness: undefined,
          slots: [
            {
              ...signature,
              ideal: unit("bladeChampion", undefined),
              picked: null,
              readiness: undefined,
            },
          ],
        })}
      />
    )

    expect(
      screen.queryByTestId("guild-raid-exact-meta-status")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("guild-raid-exact-meta-team-readiness")
    ).not.toBeInTheDocument()
    const slot = screen.getByTestId("guild-raid-exact-meta-slot-0")
    expect(slot).toHaveTextContent("BladeChampion")
    expect(slot).not.toHaveTextContent("%")
  })

  it("points at empty slots and the weakest essential slot, and opens a slot from there", async () => {
    const user = userEvent.setup()
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation()}
      />
    )

    const focus = screen.getByTestId("guild-raid-exact-meta-focus")
    const lines = within(focus).getAllByRole("button")
    expect(lines.map((line) => line.textContent)).toEqual([
      'guildRaids.exactMeta.focus.empty:{"slot":"Flex","name":"Helbrecht"}',
      'guildRaids.exactMeta.focus.weakest:{"slot":"Core","name":"Dante","percent":60}',
    ])

    await user.click(lines[1]!)
    expect(screen.getByTestId("guild-raid-exact-meta-slot-1")).toHaveAttribute(
      "aria-expanded",
      "true"
    )
  })

  it("has no investment hint before the roster is known", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile
        recommendation={recommendation({ status: undefined })}
      />
    )

    expect(
      screen.queryByTestId("guild-raid-exact-meta-focus")
    ).not.toBeInTheDocument()
  })
})
