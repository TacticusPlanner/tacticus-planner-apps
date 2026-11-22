import { useState } from "react"
import type { i18n as I18n } from "i18next"
import userEvent from "@testing-library/user-event"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { Switch } from "@workspace/ui/components/switch"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen, within } from "@/test/render"

import { FilterField, FiltersControl } from "./filters-control"

const mobile = vi.hoisted(() => ({ value: false }))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobile.value,
}))

let i18n: I18n

function Harness({ size }: { size: "compact" | "form" }) {
  const [owned, setOwned] = useState(false)
  return (
    <FiltersControl
      count={owned ? 1 : 0}
      onClear={() => setOwned(false)}
      size={size}
      testId="filters"
    >
      <FilterField inline label="Owned only">
        {({ id }) => (
          <Switch checked={owned} id={id} onCheckedChange={setOwned} />
        )}
      </FilterField>
    </FiltersControl>
  )
}

const renderControl = (size: "compact" | "form") =>
  render(<Harness size={size} />, { wrapper: i18nWrapper(i18n) })

describe("FiltersControl", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    mobile.value = false
  })

  it("counts the active filters on the button and clears them from the panel", async () => {
    const user = userEvent.setup()
    renderControl("compact")
    await user.click(screen.getByRole("button", { name: "Filters" }))

    const clear = screen.getByRole("button", { name: "Clear filters" })
    expect(clear).toBeDisabled()
    await user.click(screen.getByRole("switch", { name: "Owned only" }))
    expect(
      screen.getByRole("button", { name: "Filters, 1 active" })
    ).toHaveTextContent("1")
    expect(clear).toBeEnabled()

    await user.click(clear)
    expect(screen.getByRole("switch", { name: "Owned only" })).not.toBeChecked()
    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument()
  })

  it("opens a compact panel as a popover on desktop, closed by Done", async () => {
    const user = userEvent.setup()
    renderControl("compact")
    const button = screen.getByRole("button", { name: "Filters" })
    await user.click(button)

    expect(screen.queryByRole("heading", { name: "Filters" })).toBeNull()
    expect(screen.getByTestId("filters-panel")).toBeVisible()
    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(button).toHaveAttribute("aria-expanded", "false")
  })

  it.each([
    ["a form panel on desktop", "form", false],
    ["a compact panel on mobile", "compact", true],
  ] as const)(
    "opens %s as a titled dialog and hands focus back on Done",
    async (_, size, isMobile) => {
      mobile.value = isMobile
      const user = userEvent.setup()
      renderControl(size)
      const button = screen.getByRole("button", { name: "Filters" })
      await user.click(button)

      expect(screen.getByRole("dialog", { name: "Filters" })).toBeVisible()
      await user.click(screen.getByRole("button", { name: "Done" }))
      expect(screen.queryByRole("dialog")).toBeNull()
      expect(button).toHaveFocus()
    }
  )

  it.each([
    ["the compact popover", "compact", false],
    ["the dialog", "form", false],
    ["the mobile sheet", "compact", true],
  ] as const)(
    "keeps the filters and refocuses Filters when %s is dismissed with Escape",
    async (_, size, isMobile) => {
      mobile.value = isMobile
      const user = userEvent.setup()
      renderControl(size)
      await user.click(screen.getByRole("button", { name: "Filters" }))
      await user.click(screen.getByRole("switch", { name: "Owned only" }))

      await user.keyboard("{Escape}")
      const button = screen.getByRole("button", { name: "Filters, 1 active" })
      expect(button).toHaveAttribute("aria-expanded", "false")
      expect(button).toHaveFocus()

      await user.click(button)
      expect(screen.getByRole("switch", { name: "Owned only" })).toBeChecked()
    }
  )

  it("leads a field's label with its decorative game icon, still named by the label alone", () => {
    render(
      <FilterField icon="movement" label="Movement">
        {({ id }) => <input id={id} />}
      </FilterField>
    )

    expect(
      screen.getByRole("textbox", { name: "Movement" })
    ).toBeInTheDocument()
    const label = screen.getByText("Movement")
    // Drawn, but hidden from assistive tech: the label's text already names the field.
    expect(
      within(label).getByRole("presentation", { hidden: true })
    ).toHaveAttribute("src", expect.stringContaining("ui_icon_stat_move"))
    expect(within(label).queryByRole("presentation")).toBeNull()
  })
})
