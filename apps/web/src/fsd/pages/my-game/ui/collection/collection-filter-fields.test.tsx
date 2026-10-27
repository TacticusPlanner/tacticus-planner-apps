import { beforeAll, describe, expect, it, vi } from "vitest"
import type { i18n as I18n } from "i18next"
import { I18nextProvider } from "react-i18next"

import { createTestI18n } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import { defaultCollectionQuery } from "../../model/collection-query"
import { CollectionFilterFields } from "./collection-filter-fields"

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en")
})

const factions = [
  { id: "Ultramarines", name: "Ultramarines", alliance: "Imperial" as const },
  { id: "BlackLegion", name: "Black Legion", alliance: "Chaos" as const },
]

function renderFields(rosterAvailable = true) {
  const update = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <CollectionFilterFields
        query={defaultCollectionQuery}
        update={update}
        factions={factions}
        rosterAvailable={rosterAvailable}
      />
    </I18nextProvider>
  )
  return update
}

/** Opens a Radix select from the keyboard (jsdom has no pointer capture) and picks `name`. */
function choose(trigger: HTMLElement, name: string) {
  trigger.focus()
  fireEvent.keyDown(trigger, { key: "Enter" })
  fireEvent.click(screen.getByRole("option", { name }))
}

describe("CollectionFilterFields", () => {
  it("changes the query from each select", () => {
    const update = renderFields()

    choose(screen.getByLabelText("Alliance"), "Chaos")
    expect(update).toHaveBeenLastCalledWith({ alliance: "Chaos" })

    choose(screen.getByLabelText("Ownership"), "Not owned")
    expect(update).toHaveBeenLastCalledWith({ ownership: "unowned" })

    choose(screen.getByLabelText("Unit type"), "Machines of War")
    expect(update).toHaveBeenLastCalledWith({ kind: "mow" })
  })

  it("changes the query from the faction, rarity and rank pickers", () => {
    const update = renderFields()

    fireEvent.click(screen.getByRole("combobox", { name: "Faction" }))
    fireEvent.click(screen.getByRole("option", { name: /Black Legion/ }))
    expect(update).toHaveBeenLastCalledWith({ factions: ["BlackLegion"] })

    fireEvent.click(screen.getByRole("combobox", { name: "Rarity" }))
    fireEvent.click(screen.getByRole("option", { name: /Mythic/ }))
    expect(update).toHaveBeenLastCalledWith({ rarities: ["Mythic"] })

    fireEvent.click(screen.getByRole("combobox", { name: "Lowest rank" }))
    fireEvent.click(screen.getByRole("option", { name: /Gold I$/ }))
    expect(update).toHaveBeenLastCalledWith({ rankMin: "Gold1" })

    fireEvent.click(screen.getByRole("combobox", { name: "Highest rank" }))
    fireEvent.click(screen.getByRole("option", { name: /Diamond III/ }))
    expect(update).toHaveBeenLastCalledWith({ rankMax: "Diamond3" })
  })

  it("disables rank range and ownership without a roster and explains why", () => {
    renderFields(false)

    const note = "Rank and ownership filters need a synced roster."
    expect(screen.getByText(note)).toBeInTheDocument()
    expect(screen.getByLabelText("Ownership")).toBeDisabled()
    expect(screen.getByLabelText("Ownership")).toHaveAccessibleDescription(note)
    const rankRange = screen.getByRole("group", { name: "Rank range" })
    expect(rankRange).toHaveAccessibleDescription(note)
    for (const picker of within(rankRange).getAllByRole("combobox")) {
      expect(picker).toBeDisabled()
    }
    expect(screen.getByLabelText("Alliance")).toBeEnabled()
    expect(screen.getByRole("combobox", { name: "Rarity" })).toBeEnabled()
  })
})
