import userEvent from "@testing-library/user-event"
import type { i18n as I18n } from "i18next"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"
import {
  hseVariant,
  type HseFixtureId,
} from "@/test/fixtures/home-screen-event-scoring"
import { hseTeamsFixtureRead } from "@/test/fixtures/hse-teams"
import enDailies from "../../../../../../public/locales/en/dailies.json"
import enNpcs from "../../../../../../public/locales/en/npcs.json"
import enTeamRecs from "../../../../../../public/locales/en/teamRecs.json"

import { mapRosterCharacter } from "../../model/roster-character"
import { buildHseTeamRecommendations } from "../../model/hse-team-recommendations"
import { anyUnitPowerFixture } from "../../model/team-power.fixtures"
import type {
  HseTeamCatalog,
  HseTeamsViewModel,
} from "../../model/hse-team-recommendations.types"
import { HseTeamsSection } from "./hse-teams-section"

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en", {
    en: {
      dailies: enDailies,
      npcs: enNpcs,
      teamRecs: enTeamRecs,
    },
  })
})
afterEach(() => vi.unstubAllGlobals())

function readyView(
  definitionId: HseFixtureId,
  variantKey?: string
): HseTeamsViewModel {
  const read = hseTeamsFixtureRead()
  if (read.status !== "ready") throw new Error("fixture read")
  return {
    status: "ready",
    recommendations: buildHseTeamRecommendations({
      trackers: hseVariant(definitionId, variantKey).trackers,
      roster: read.roster.map(mapRosterCharacter),
      catalog: read.catalog as unknown as HseTeamCatalog,
      unitPower: anyUnitPowerFixture(),
    }),
  }
}

const renderSection = (view: HseTeamsViewModel, width = 1024) => {
  setViewportWidth(width)
  return render(<HseTeamsSection view={view} />, {
    wrapper: i18nWrapper(i18n),
  })
}

describe("HseTeamsSection on desktop", () => {
  it("shows the Arena card and a row of three alliance cards for Onslaught and Salvage Run", () => {
    renderSection(readyView("hse-trait-boost-psyker"))

    const section = screen.getByTestId("hse-teams")
    expect(section).toHaveTextContent("Event teams")
    expect(screen.getByTestId("hse-teams-desktop")).toBeInTheDocument()
    expect(screen.getByTestId("hse-team-arena")).toBeInTheDocument()
    for (const mode of ["onslaught", "salvagerun"]) {
      const row = screen.getByTestId(`hse-teams-mode-${mode}`)
      expect(within(row).getByTestId(`hse-team-${mode}-imperial`)).toBeVisible()
      expect(within(row).getByTestId(`hse-team-${mode}-chaos`)).toBeVisible()
      expect(
        within(row).getByTestId(`hse-team-${mode}-xenos-insufficient-track`)
      ).toHaveTextContent("Not enough Xenos characters")
    }
  })

  it("names the event units and marks a team filled with others as broadened", () => {
    renderSection(readyView("hse-trait-boost-psyker"))

    const imperial = screen.getByTestId("hse-team-onslaught-imperial")
    const rows = within(
      within(imperial).getByTestId("hse-team-onslaught-imperial-members")
    ).getAllByRole("listitem")
    expect(rows).toHaveLength(5)
    expect(rows[0]).toHaveTextContent("Mephiston")
    expect(rows[0]).toHaveTextContent("Scores for the event (Psyker).")
    expect(rows[4]).toHaveTextContent("Calgar")
    expect(rows[4]).toHaveTextContent("Chosen for combat strength")
    expect(
      within(imperial).getByTestId("hse-team-onslaught-imperial-broadened")
    ).toHaveTextContent("Fewer than five of these characters score")
    expect(
      screen.queryByTestId("hse-team-onslaught-chaos-broadened")
    ).not.toBeInTheDocument()
  })

  it("states For the Emperor's enemy rule in every mode", () => {
    renderSection(readyView("hse-for-the-emperor"))

    for (const mode of ["arena", "onslaught", "salvagerun"])
      expect(screen.getByTestId(`hse-teams-hints-${mode}`)).toHaveTextContent(
        "Only kills of non-Imperial enemies count."
      )
    expect(
      screen.getByTestId("hse-team-onslaught-chaos-broadened")
    ).toHaveTextContent("None of these characters score")
  })

  it("names Squig Smash's scoring enemy and says any unit scores", () => {
    renderSection(readyView("hse-squig-smash"))

    expect(screen.getByTestId("hse-teams-hints-arena")).toHaveTextContent(
      "Only kills of Large Squig count."
    )
    expect(screen.getByTestId("hse-team-arena-any-unit")).toHaveTextContent(
      "Any unit scores"
    )
  })

  it("shows only the modes the event scores in", () => {
    renderSection(readyView("hse-11th-edition-week-2"))

    expect(screen.getByTestId("hse-teams-mode-onslaught")).toBeInTheDocument()
    expect(screen.queryByTestId("hse-teams-mode-arena")).toBeNull()
    expect(screen.queryByTestId("hse-teams-mode-salvagerun")).toBeNull()
  })

  it("names the Faction Focus faction", () => {
    renderSection(readyView("hse-faction-focus"))

    expect(
      screen.getByTestId("hse-team-onslaught-chaos-faction")
    ).toHaveTextContent("Your strongest faction here: Thousand Sons.")
  })

  it("says a broadened Faction Focus team lacks a full line-up of its faction", () => {
    renderSection(readyView("hse-faction-focus"))

    const broadened = screen.getByTestId("hse-team-arena-broadened")
    expect(broadened).toHaveTextContent("Line-up points need a full team")
    expect(broadened).toHaveTextContent("fewer than five Ultramarines")
    expect(broadened).not.toHaveTextContent("Fewer than five of these")
  })
})

describe("HseTeamsSection on mobile", () => {
  it("defaults the segmented control to Arena and stacks the chosen mode's alliance teams", async () => {
    const user = userEvent.setup()
    renderSection(readyView("hse-trait-boost-psyker"), 420)

    expect(screen.getByTestId("hse-teams-mobile")).toBeInTheDocument()
    expect(screen.queryByTestId("hse-teams-desktop")).toBeNull()
    expect(screen.getByTestId("hse-teams-mode-option-arena")).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(screen.getByTestId("hse-team-arena")).toBeInTheDocument()
    expect(screen.queryByTestId("hse-team-onslaught-imperial")).toBeNull()

    await user.click(screen.getByTestId("hse-teams-mode-option-onslaught"))

    const mode = screen.getByTestId("hse-teams-mode-onslaught")
    expect(
      within(mode).getByTestId("hse-team-onslaught-imperial")
    ).toBeVisible()
    expect(within(mode).getByTestId("hse-team-onslaught-chaos")).toBeVisible()
    expect(
      within(mode).getByTestId("hse-team-onslaught-xenos-insufficient-track")
    ).toBeVisible()
    expect(screen.queryByTestId("hse-team-arena")).toBeNull()
  })

  it("shows the mode's hint under the control", () => {
    renderSection(readyView("hse-for-the-emperor"), 420)

    expect(screen.getByTestId("hse-teams-hints-arena")).toHaveTextContent(
      "non-Imperial"
    )
  })
})

describe("HseTeamsSection states", () => {
  it("renders nothing when hidden", () => {
    renderSection({ status: "hidden" })
    expect(screen.queryByTestId("hse-teams")).toBeNull()
  })

  it("shows the shared loading state", () => {
    renderSection({ status: "loading" })
    expect(screen.getByTestId("hse-teams-loading")).toBeInTheDocument()
  })

  it("shows the shared error state with a retry", async () => {
    const user = userEvent.setup()
    const retry = vi.fn()
    renderSection({ status: "error", retry })

    expect(screen.getByTestId("hse-teams-error")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Retry" }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
