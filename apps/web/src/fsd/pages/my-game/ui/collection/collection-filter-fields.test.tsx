import { beforeAll, describe, expect, it, vi } from "vitest"
import type { i18n as I18n } from "i18next"
import { I18nextProvider } from "react-i18next"

import { createTestI18n } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import { defaultCollectionQuery } from "../../model/collection-query"
import type { CollectionOptions } from "../../model/use-collection-options"
import { CollectionFilterFields } from "./collection-filter-fields"

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en")
})

const options: CollectionOptions = {
  factions: [
    { id: "Ultramarines", name: "Ultramarines", alliance: "Imperial" },
    { id: "BlackLegion", name: "Black Legion", alliance: "Chaos" },
  ],
  hits: [1, 2, 3],
  movements: [2, 3],
  ranges: [2, 3],
  damageTypes: [{ id: "Bolter", name: "Bolter" }],
  traits: [
    { id: "Flying", name: "Flying" },
    { id: "Psyker", name: "Psyker" },
  ],
  shardSources: ["Elite", "none"],
}

function renderFields(rosterAvailable = true) {
  const update = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <CollectionFilterFields
        query={defaultCollectionQuery}
        update={update}
        options={options}
        rosterAvailable={rosterAvailable}
        layout="panel"
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

  it("changes the query from each combat control", () => {
    const update = renderFields()

    choose(screen.getByLabelText("Attack type"), "Ranged")
    expect(update).toHaveBeenLastCalledWith({ attack: "ranged" })

    choose(screen.getByLabelText("Fewest hits"), "2")
    expect(update).toHaveBeenLastCalledWith({ hitsMin: 2 })

    choose(screen.getByLabelText("Most hits"), "3")
    expect(update).toHaveBeenLastCalledWith({ hitsMax: 3 })

    choose(screen.getByLabelText("Movement"), "3")
    expect(update).toHaveBeenLastCalledWith({ movement: 3 })

    choose(screen.getByLabelText("Shortest range"), "2")
    expect(update).toHaveBeenLastCalledWith({ rangeMin: 2 })

    choose(screen.getByLabelText("Longest range"), "3")
    expect(update).toHaveBeenLastCalledWith({ rangeMax: 3 })

    fireEvent.click(screen.getByRole("combobox", { name: "Damage types" }))
    fireEvent.click(screen.getByRole("option", { name: /Bolter/ }))
    expect(update).toHaveBeenLastCalledWith({ damageTypes: ["Bolter"] })

    fireEvent.click(screen.getByRole("combobox", { name: "Traits" }))
    fireEvent.click(screen.getByRole("option", { name: /Psyker/ }))
    expect(update).toHaveBeenLastCalledWith({ traits: ["Psyker"] })

    fireEvent.click(screen.getByRole("combobox", { name: "Shard source" }))
    fireEvent.click(screen.getByRole("option", { name: /Not in a campaign/ }))
    expect(update).toHaveBeenLastCalledWith({ shardSources: ["none"] })

    fireEvent.click(screen.getByRole("combobox", { name: "Lowest stars" }))
    fireEvent.click(
      screen.getByRole("option", { name: /Legendary · Red Three Stars/ })
    )
    expect(update).toHaveBeenLastCalledWith({
      starsMin: "Legendary:RedThreeStars",
    })
  })

  it("keeps both ends of each range in one named group", () => {
    renderFields()
    for (const [range, ends] of [
      ["Rank range", ["Lowest rank", "Highest rank"]],
      ["Stars range", ["Lowest stars", "Highest stars"]],
      ["Hits", ["Fewest hits", "Most hits"]],
      ["Attack range", ["Shortest range", "Longest range"]],
    ] as const) {
      const group = screen.getByRole("group", { name: range })
      for (const end of ends) {
        expect(
          within(group).getByRole("combobox", { name: end })
        ).toBeInTheDocument()
      }
    }
  })

  it("clears each multi-select in one step once something is picked", () => {
    const update = vi.fn()
    render(
      <I18nextProvider i18n={i18n}>
        <CollectionFilterFields
          query={{
            ...defaultCollectionQuery,
            factions: ["BlackLegion"],
            rarities: ["Epic"],
            damageTypes: ["Bolter"],
            traits: ["Psyker", "Flying"],
            shardSources: ["none"],
          }}
          update={update}
          options={options}
          rosterAvailable
          layout="panel"
        />
      </I18nextProvider>
    )

    for (const [button, patch] of [
      ["Clear factions", { factions: [] }],
      ["Clear rarities", { rarities: [] }],
      ["Clear damage types", { damageTypes: [] }],
      ["Clear traits", { traits: [] }],
      ["Clear shard sources", { shardSources: [] }],
    ] as const) {
      fireEvent.click(screen.getByRole("button", { name: button }))
      expect(update).toHaveBeenLastCalledWith(patch)
    }
  })

  it("offers no clear button while nothing is picked", () => {
    renderFields()
    expect(screen.queryByRole("button", { name: /^Clear/ })).toBeNull()
  })

  it("groups the controls under Unit and Combat", () => {
    renderFields()
    const combat = screen.getByRole("region", { name: "Combat" })
    expect(within(combat).getByLabelText("Attack type")).toBeInTheDocument()
    const unit = screen.getByRole("region", { name: "Unit" })
    expect(within(unit).getByLabelText("Alliance")).toBeInTheDocument()
  })

  it("disables rank range, stars range and ownership without a roster and explains why", () => {
    renderFields(false)

    const note = "Rank, stars and ownership filters need a synced roster."
    expect(screen.getByText(note)).toBeInTheDocument()
    expect(screen.getByLabelText("Ownership")).toBeDisabled()
    expect(screen.getByLabelText("Ownership")).toHaveAccessibleDescription(note)
    const rankRange = screen.getByRole("group", { name: "Rank range" })
    expect(rankRange).toHaveAccessibleDescription(note)
    for (const picker of within(rankRange).getAllByRole("combobox")) {
      expect(picker).toBeDisabled()
    }
    const starsRange = screen.getByRole("group", { name: "Stars range" })
    expect(starsRange).toHaveAccessibleDescription(note)
    for (const picker of within(starsRange).getAllByRole("combobox")) {
      expect(picker).toBeDisabled()
    }
    expect(screen.getByLabelText("Alliance")).toBeEnabled()
    expect(screen.getByRole("combobox", { name: "Rarity" })).toBeEnabled()
    // The combat filters read only the catalog, so they stay available.
    expect(screen.getByLabelText("Attack type")).toBeEnabled()
    expect(screen.getByRole("combobox", { name: "Traits" })).toBeEnabled()
  })
})
