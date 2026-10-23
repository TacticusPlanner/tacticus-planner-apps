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
})
