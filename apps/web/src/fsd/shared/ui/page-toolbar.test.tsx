import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, within } from "@/test/render"

import { GroupByControl, PageToolbar, SegmentedControl } from "./page-toolbar"

const mobile = vi.hoisted(() => ({ value: false }))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobile.value,
}))

function Toolbar({ onGroup = vi.fn() }: { onGroup?: (v: string) => void }) {
  return (
    <PageToolbar
      actions={<button type="button">Create goal</button>}
      chips={<span>chips</span>}
      find={<input aria-label="Search" />}
      testId="toolbar"
      view={
        <GroupByControl
          onValueChange={onGroup}
          options={[
            { value: "none", label: "None" },
            { value: "faction", label: "Faction" },
          ]}
          value="faction"
        />
      }
      viewTestId="view"
    />
  )
}

const slot = (name: string): HTMLElement =>
  screen
    .getByTestId("toolbar")
    .querySelector(`[data-slot="page-toolbar-${name}"]`) as HTMLElement

describe("PageToolbar", () => {
  beforeEach(() => {
    mobile.value = false
  })

  it("lays out Find, View and Actions in order on desktop, chips below", () => {
    render(<Toolbar />)

    const find = slot("find")
    const view = slot("view")
    const actions = slot("actions")
    expect(find).toContainElement(
      screen.getByRole("textbox", { name: "Search" })
    )
    expect(view).toBe(screen.getByTestId("view"))
    expect(actions).toHaveTextContent("Create goal")
    expect(
      find.compareDocumentPosition(view) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      view.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(slot("chips")).toHaveTextContent("chips")
  })

  it("names Group by and ignores a press on the picked option", async () => {
    const onGroup = vi.fn()
    render(<Toolbar onGroup={onGroup} />)

    const group = screen.getByRole("radiogroup", { name: "Group by" })
    await userEvent.click(within(group).getByRole("radio", { name: "Faction" }))
    expect(onGroup).not.toHaveBeenCalled()
    await userEvent.click(within(group).getByRole("radio", { name: "None" }))
    expect(onGroup).toHaveBeenCalledWith("none")
  })

  it("keeps the View controls behind a View button that opens a sheet on mobile", async () => {
    mobile.value = true
    render(<Toolbar />)

    expect(screen.queryByRole("radiogroup", { name: "Group by" })).toBeNull()
    const button = screen.getByTestId("view")
    expect(button).toHaveAccessibleName("View")
    await userEvent.click(button)

    const sheet = screen.getByRole("dialog", { name: "View options" })
    expect(
      within(sheet).getByRole("radiogroup", { name: "Group by" })
    ).toBeInTheDocument()
    await userEvent.click(within(sheet).getByRole("button", { name: "Done" }))
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})

function Layout({ onChange = vi.fn() }: { onChange?: (v: string) => void }) {
  return (
    <SegmentedControl
      label="Layout"
      onValueChange={onChange}
      options={[
        { value: "cards", label: "Cards", hint: "One card per team" },
        { value: "table", label: "Table" },
        {
          value: "map",
          label: "Map",
          disabledReason: "Needs a synced roster.",
        },
      ]}
      value="table"
    />
  )
}

describe("SegmentedControl", () => {
  it("shows an option's hint on hover and keeps its pressed state", async () => {
    const onChange = vi.fn()
    render(<Layout onChange={onChange} />)
    const cards = screen.getByRole("radio", { name: "Cards" })
    expect(cards).toHaveAttribute("data-state", "off")
    expect(screen.getByRole("radio", { name: "Table" })).toHaveAttribute(
      "data-state",
      "on"
    )

    await userEvent.hover(cards)
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "One card per team"
    )

    await userEvent.click(cards)
    expect(onChange).toHaveBeenCalledWith("cards")
  })

  it("keeps a disabled-with-reason option focusable, unpickable and explained", async () => {
    const onChange = vi.fn()
    render(<Layout onChange={onChange} />)
    const map = screen.getByRole("radio", { name: "Map" })
    expect(map).toHaveAttribute("aria-disabled", "true")
    expect(map).not.toBeDisabled()

    await userEvent.click(map)
    expect(onChange).not.toHaveBeenCalled()
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Needs a synced roster."
    )
  })
})
