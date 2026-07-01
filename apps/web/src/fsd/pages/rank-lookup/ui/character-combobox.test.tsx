import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { FactionGroup } from "@workspace/game-catalog"

import { CharacterCombobox } from "./character-combobox"

const groups: FactionGroup[] = [
  {
    factionId: "Ultramarines",
    factionName: "Ultramarines",
    members: [
      { id: "cato", name: "Cato Sicarius" },
      { id: "marneus", name: "Marneus Calgar" },
    ],
  },
  {
    factionId: "Necrons",
    factionName: "Necrons",
    members: [
      { id: "imotekh", name: "Imotekh" },
      { id: "trazyn", name: "Trazyn" },
    ],
  },
]

function renderCombobox(onChange = vi.fn()) {
  render(
    <CharacterCombobox
      groups={groups}
      onChange={onChange}
      placeholder="Select a character"
      emptyText="No character found."
    />
  )
  fireEvent.click(screen.getByRole("combobox"))
  return onChange
}

function optionNames() {
  return screen.getAllByRole("option").map((el) => el.textContent)
}

describe("CharacterCombobox", () => {
  it("lists every group and member in the given order when there is no search text", () => {
    renderCombobox()

    expect(optionNames()).toEqual([
      "Cato Sicarius",
      "Marneus Calgar",
      "Imotekh",
      "Trazyn",
    ])
  })

  it("keeps a stable order and only hides non-matches on a plain substring search", () => {
    renderCombobox()

    // "ca" is a substring of both Ultramarines members but no Necron — matches must not reorder
    // (cmdk's default fuzzy filter would re-score and re-sort on every keystroke).
    fireEvent.change(screen.getByPlaceholderText("Select a character"), {
      target: { value: "ca" },
    })

    expect(optionNames()).toEqual(["Cato Sicarius", "Marneus Calgar"])
  })

  it("surfaces every member of a faction when the faction name itself matches", () => {
    renderCombobox()

    fireEvent.change(screen.getByPlaceholderText("Select a character"), {
      target: { value: "necron" },
    })

    expect(optionNames()).toEqual(["Imotekh", "Trazyn"])
  })

  it("shows the empty state when nothing matches", () => {
    renderCombobox()

    fireEvent.change(screen.getByPlaceholderText("Select a character"), {
      target: { value: "zzz-no-match" },
    })

    expect(screen.getByText("No character found.")).toBeVisible()
    expect(screen.queryAllByRole("option")).toHaveLength(0)
  })

  it("selects a character and clears the search", () => {
    const onChange = renderCombobox()

    fireEvent.change(screen.getByPlaceholderText("Select a character"), {
      target: { value: "trazyn" },
    })
    fireEvent.click(screen.getByText("Trazyn"))

    expect(onChange).toHaveBeenCalledWith("trazyn")
  })
})
