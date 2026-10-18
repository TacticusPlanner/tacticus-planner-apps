import { useState } from "react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it } from "vitest"
import type { i18n as I18n } from "i18next"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen } from "@/test/render"

import { BattleSelector } from "./battle-selector"
import { lysanderLane } from "./battles.test-utils"

let i18n: I18n
const alpha = lysanderLane("alpha", 3)

function Harness({
  isMobile,
  initial = 0,
}: {
  isMobile: boolean
  initial?: number
}) {
  const [selected, setSelected] = useState(initial)
  return (
    <>
      <BattleSelector
        battles={alpha}
        isMobile={isMobile}
        onSelect={setSelected}
        selectedIndex={selected}
      />
      <output data-testid="selected">{selected + 1}</output>
    </>
  )
}

const renderSelector = (isMobile: boolean, initial?: number) =>
  render(<Harness initial={initial} isMobile={isMobile} />, {
    wrapper: i18nWrapper(i18n),
  })

describe("BattleSelector", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("picks a battle directly on desktop and names complete battles for assistive technology", () => {
    renderSelector(false)
    const items = screen.getAllByTestId("battle-selector-item")
    expect(items).toHaveLength(18)
    expect(items[0]).toHaveAttribute("data-state", "on")

    fireEvent.click(screen.getByRole("radio", { name: "9" }))
    expect(screen.getByTestId("selected")).toHaveTextContent("9")
    expect(items[8]).toHaveAttribute("data-state", "on")
    expect(items[0]).toHaveAccessibleName("1 complete")
    expect(items[2]).toHaveAccessibleName("3 complete")
    expect(items[3]).toHaveAccessibleName("4")
  })

  it("steps through battles on mobile", () => {
    renderSelector(true)
    const previous = screen.getByRole("button", { name: "Previous battle" })
    expect(previous).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: "Next battle" }))
    fireEvent.click(screen.getByRole("button", { name: "Next battle" }))
    expect(screen.getByTestId("battle-selector-menu")).toHaveTextContent(
      "Battle 3 of 18"
    )
    expect(previous).toBeEnabled()
  })

  it("disables Next at the last battle and jumps from the menu on mobile", async () => {
    const user = userEvent.setup()
    renderSelector(true, 17)
    expect(screen.getByRole("button", { name: "Next battle" })).toBeDisabled()

    const menu = screen.getByTestId("battle-selector-menu")
    await user.click(menu)
    await user.click(
      screen.getByRole("menuitemradio", { name: /^Battle 2(?!\d)/ })
    )
    expect(screen.getByTestId("selected")).toHaveTextContent("2")
    expect(menu).toHaveTextContent("Battle 2 of 18")
  })
})
