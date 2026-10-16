import { useState, type ReactNode } from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { createTestI18n } from "@/test/i18n"
import type { AbilityTextEntry } from "@/shared/ability-text"

import enLibrary from "../../../../../../public/locales/en/library.json"
import npcAbilityText from "../../../../../../public/locales/en/npcAbilityText.json"
import { AbilityPanel } from "./ability-panel"

const stormOfWrath = (
  npcAbilityText as unknown as Record<string, AbilityTextEntry>
).StormOfWrath

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en", { en: { library: enLibrary } })
})

function Harness({
  text,
  playerLevel,
  levelControl,
}: {
  text: AbilityTextEntry | undefined
  playerLevel?: number
  levelControl?: ReactNode
}) {
  const [level, setLevel] = useState(58)
  return (
    <I18nextProvider i18n={i18n}>
      <AbilityPanel
        kind="Active"
        name="Storm of Wrath"
        text={text}
        rarity="Mythic"
        unitName="Tigurius"
        factionId="Ultramarines"
        level={level}
        onLevelChange={setLevel}
        maxLevel={60}
        playerLevel={playerLevel}
        levelControl={levelControl}
        data-testid="panel"
      />
    </I18nextProvider>
  )
}

describe("AbilityPanel", () => {
  it("moves the stepper, next-level line and chart marker together", () => {
    render(<Harness text={stormOfWrath} playerLevel={58} />)
    const next = screen.getByTestId("panel-next")
    expect(next).toHaveTextContent("Next level (59):")
    expect(next).toHaveTextContent("Yours: level 58")
    expect(screen.getByTestId("panel-chart-minDmg-marker")).toHaveAttribute(
      "data-index",
      "57"
    )

    fireEvent.click(
      within(screen.getByTestId("panel-stepper")).getByRole("button", {
        name: "Raise level",
      })
    )

    expect(screen.getByTestId("panel-next")).toHaveTextContent(
      "Next level (60):"
    )
    expect(screen.getByTestId("panel-chart-minDmg-marker")).toHaveAttribute(
      "data-index",
      "58"
    )
  })

  it("sets the level from a chart column", () => {
    render(<Harness text={stormOfWrath} />)
    fireEvent.click(screen.getByTestId("panel-chart-minDmg-column-39"))
    expect(screen.getByTestId("panel-stepper-value")).toHaveTextContent("Lv 40")
  })

  it("hides the next-level line at level 60", () => {
    render(<Harness text={stormOfWrath} />)
    fireEvent.click(screen.getByTestId("panel-chart-minDmg-column-59"))
    expect(screen.queryByTestId("panel-next")).not.toBeInTheDocument()
  })

  it("names the range series by the text that follows it", () => {
    render(<Harness text={stormOfWrath} />)
    expect(
      screen.getByRole("figure", { name: /^Psychic Damage goes from/ })
    ).toBeInTheDocument()
  })

  it("says so when the rules text is missing, with no stepper or chart", () => {
    render(<Harness text={undefined} playerLevel={46} />)
    expect(screen.getByTestId("panel-missing-text")).toHaveTextContent(
      "Rules text isn't in the planner yet."
    )
    expect(screen.getByText("Yours: level 46")).toBeInTheDocument()
    expect(screen.queryByTestId("panel-stepper")).not.toBeInTheDocument()
    expect(screen.queryByRole("figure")).not.toBeInTheDocument()
  })

  it("shows a level control in place of the stepper, and its chart doesn't set the level", () => {
    render(
      <Harness
        text={stormOfWrath}
        levelControl={<span data-testid="mythic-pill">Unlocks at Mythic</span>}
      />
    )
    expect(screen.getByTestId("mythic-pill")).toBeInTheDocument()
    expect(screen.queryByTestId("panel-stepper")).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("panel-chart-minDmg-column-39"))
    expect(screen.getByTestId("panel-chart-minDmg-marker")).toHaveAttribute(
      "data-index",
      "57"
    )
  })
})
