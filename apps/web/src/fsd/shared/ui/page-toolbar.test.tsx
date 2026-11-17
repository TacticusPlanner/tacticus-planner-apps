import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, within } from "@/test/render"

import { GroupByControl, PageToolbar } from "./page-toolbar"

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
