import type { i18n as I18n } from "i18next"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen } from "@/test/render"

import { AnnotationMenu } from "./annotation-menu"
import { BattleAnnotationMenu } from "./battle-annotation-menu"

let i18n: I18n

describe("AnnotationMenu", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("names the cell with its mark and checks the current choice", async () => {
    const user = userEvent.setup()
    render(
      <AnnotationMenu
        battle={7}
        objective="Flying"
        onChange={vi.fn()}
        status="stopHere"
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    const cell = screen.getByRole("button", {
      name: "Flying: not cleared, marked Stop here",
    })
    expect(cell).toHaveAttribute("data-mark", "stopHere")

    await user.click(cell)

    expect(
      screen.getByRole("menuitemradio", { name: "Stop here" })
    ).toHaveAttribute("aria-checked", "true")
    expect(
      screen.getByRole("menuitemradio", { name: "Not marked" })
    ).toHaveAttribute("aria-checked", "false")
    expect(screen.getByText("Flying, battle 7")).toBeInTheDocument()
  })

  it("is operable by keyboard: open, move to Maybe clear and choose it", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <AnnotationMenu
        battle={7}
        objective="Flying"
        onChange={onChange}
        status={null}
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    const cell = screen.getByRole("button", { name: "Flying: not cleared" })

    cell.focus()
    await user.keyboard("{Enter}")
    expect(
      screen.getByRole("menuitemradio", { name: "Not marked" })
    ).toHaveAttribute("aria-checked", "true")
    await user.keyboard("{ArrowDown}{Enter}")

    expect(onChange).toHaveBeenCalledWith("maybeClear")
  })

  it("chooses Not marked as null", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <AnnotationMenu
        battle={2}
        objective="Defeat all"
        onChange={onChange}
        status="maybeClear"
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    await user.click(screen.getByRole("button"))
    await user.click(screen.getByRole("menuitemradio", { name: "Not marked" }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})

describe("BattleAnnotationMenu", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("offers Maybe clear, Stop here and Clear marks from the row's own control, by keyboard", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <BattleAnnotationMenu
        battle={9}
        onChange={onChange}
        trigger={<button type="button">Mark battle 9</button>}
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    screen.getByRole("button", { name: "Mark battle 9" }).focus()
    await user.keyboard("{Enter}")

    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent)
    ).toEqual(["Maybe clear", "Stop here", "Clear marks"])
    // Opening by keyboard focuses Maybe clear; one step down is Stop here.
    await user.keyboard("{ArrowDown}{Enter}")
    expect(onChange).toHaveBeenLastCalledWith("stopHere")

    await user.click(screen.getByRole("button", { name: "Mark battle 9" }))
    await user.click(screen.getByRole("menuitem", { name: "Clear marks" }))
    expect(onChange).toHaveBeenLastCalledWith(null)
  })
})
