import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}))

import { RarityCombobox, type RarityComboboxItem } from "./rarity-combobox"

const items: RarityComboboxItem<string>[] = [
  { id: "h1", name: "Health Base", rarity: "Common" },
  { id: "d1", name: "Damage Base", rarity: "Common" },
  { id: "l1", name: "Legendary Core", rarity: "Legendary" },
  { id: "e1", name: "Epic Shard", rarity: "Epic" },
]

function renderCombobox({ onChange = vi.fn<(id: string) => void>() } = {}) {
  render(
    <RarityCombobox
      items={items}
      onChange={onChange}
      placeholder="Select a material"
      emptyText="No material found."
    />
  )
  fireEvent.click(screen.getByRole("combobox"))
  return onChange
}

function optionNames() {
  return screen.getAllByRole("option").map((el) => el.textContent)
}

describe("RarityCombobox", () => {
  it("groups by rarity, highest first, in a stable member order", () => {
    renderCombobox()

    expect(optionNames()).toEqual([
      "Legendary Core",
      "Epic Shard",
      "Health Base",
      "Damage Base",
    ])
  })

  it("keeps a stable order and only hides non-matches on a plain substring search", () => {
    renderCombobox()

    fireEvent.change(screen.getByPlaceholderText("Select a material"), {
      target: { value: "base" },
    })

    expect(optionNames()).toEqual(["Health Base", "Damage Base"])
  })

  it("surfaces every member of a rarity when the rarity name itself matches", () => {
    renderCombobox()

    fireEvent.change(screen.getByPlaceholderText("Select a material"), {
      target: { value: "common" },
    })

    expect(optionNames()).toEqual(["Health Base", "Damage Base"])
  })

  it("shows the empty state when nothing matches", () => {
    renderCombobox()

    fireEvent.change(screen.getByPlaceholderText("Select a material"), {
      target: { value: "zzz-no-match" },
    })

    expect(screen.getByText("No material found.")).toBeVisible()
    expect(screen.queryAllByRole("option")).toHaveLength(0)
  })

  it("selects an item and clears the search", () => {
    const onChange = renderCombobox()

    fireEvent.change(screen.getByPlaceholderText("Select a material"), {
      target: { value: "legendary" },
    })
    fireEvent.click(screen.getByText("Legendary Core"))

    expect(onChange).toHaveBeenCalledWith("l1")
  })

  it("sorts a group-overridden item (e.g. relic equipment) above its normal rarity position", () => {
    render(
      <RarityCombobox
        items={[
          { id: "m1", name: "Mythic Blade", rarity: "Mythic" },
          {
            id: "r1",
            name: "Relic Blade",
            rarity: "Legendary",
            group: { key: "Relic", label: "Relic", rank: 100 },
          },
          { id: "l1", name: "Legendary Core", rarity: "Legendary" },
        ]}
        onChange={vi.fn()}
        placeholder="Select a material"
        emptyText="No material found."
      />
    )
    fireEvent.click(screen.getByRole("combobox"))

    // Relic Blade's override outranks even Mythic, despite its own rarity being Legendary; the
    // non-overridden Legendary Core stays grouped under the normal "Legendary" heading.
    expect(optionNames()).toEqual([
      "Relic Blade",
      "Mythic Blade",
      "Legendary Core",
    ])
    expect(screen.getByText("Relic")).toBeInTheDocument()
  })

  it("renders each item's optional trailing meta content", () => {
    render(
      <RarityCombobox
        items={[
          {
            id: "h1",
            name: "Health Base",
            rarity: "Common",
            meta: <span>required × 3</span>,
          },
        ]}
        onChange={vi.fn()}
        placeholder="Select a material"
        emptyText="No material found."
      />
    )
    fireEvent.click(screen.getByRole("combobox"))

    expect(screen.getByText("required × 3")).toBeInTheDocument()
  })
})
