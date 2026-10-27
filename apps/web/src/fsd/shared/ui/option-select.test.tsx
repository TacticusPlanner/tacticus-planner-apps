import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"

import { render, screen } from "@/test/render"

import { MultiSelect, SearchableSelect } from "./option-select"

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
]

async function expectTriggerControlsListbox(name: string) {
  const user = userEvent.setup()
  const trigger = screen.getByRole("combobox", { name })
  expect(trigger).not.toHaveAttribute("aria-controls")

  await user.click(trigger)

  expect(trigger).toHaveAttribute("aria-expanded", "true")
  expect(
    document.getElementById(trigger.getAttribute("aria-controls") ?? "")
  ).toBe(screen.getByRole("listbox"))
}

describe("option-select", () => {
  it("links the open MultiSelect trigger to its listbox", async () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={vi.fn()}
        placeholder="All letters"
      />
    )
    await expectTriggerControlsListbox("All letters")
  })

  it("links the open SearchableSelect trigger to its listbox", async () => {
    render(
      <SearchableSelect
        options={options}
        value={undefined}
        onChange={vi.fn()}
        placeholder="No limit"
        clearLabel="Clear"
      />
    )
    await expectTriggerControlsListbox("No limit")
  })

  it("clears a MultiSelect selection in one step when it has a clear label", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(
      <MultiSelect
        options={options}
        value={["a", "b"]}
        onChange={onChange}
        placeholder="All letters"
        clearLabel="Clear letters"
      />
    )

    await user.click(screen.getByRole("button", { name: "Clear letters" }))
    expect(onChange).toHaveBeenCalledWith([])

    // Nothing to clear: no button.
    rerender(
      <MultiSelect
        options={options}
        value={[]}
        onChange={onChange}
        placeholder="All letters"
        clearLabel="Clear letters"
      />
    )
    expect(
      screen.queryByRole("button", { name: "Clear letters" })
    ).not.toBeInTheDocument()
  })

  it("has no clear button without a clear label", () => {
    render(
      <MultiSelect
        options={options}
        value={["a"]}
        onChange={vi.fn()}
        placeholder="All letters"
      />
    )
    expect(screen.queryByRole("button", { name: /clear/i })).toBeNull()
  })

  it("shows as many chips as fit, then +N naming the rest", () => {
    // A 100px trigger and 40px chips: one chip plus room for "+N" fits, a second does not.
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(100)
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(40)
    render(
      <MultiSelect
        options={[...options, { value: "c", label: "Gamma" }]}
        value={["a", "b", "c"]}
        onChange={vi.fn()}
        placeholder="All letters"
      />
    )

    const trigger = screen.getByRole("combobox", { name: "All letters" })
    const more = screen.getByTestId("select-more-chip")
    expect(more).toHaveTextContent("+2")
    expect(more).toHaveAttribute("title", "Beta, Gamma")
    expect(trigger).toHaveTextContent(/^Alpha\+2/)
    vi.restoreAllMocks()
  })

  it("shows every chip when they all fit", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200)
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(40)
    render(
      <MultiSelect
        options={options}
        value={["a", "b"]}
        onChange={vi.fn()}
        placeholder="All letters"
      />
    )

    expect(screen.queryByTestId("select-more-chip")).toBeNull()
    vi.restoreAllMocks()
  })
})
