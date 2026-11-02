import { useLocation, useNavigationType } from "react-router"
import { beforeEach, describe, expect, it } from "vitest"

import { act, renderHook } from "@/test/render"

import { defaultCollectionQuery } from "./collection-query"
import type { CollectionOptions } from "./use-collection-options"
import { useCollectionQuery } from "./use-collection-query"

const named = (...ids: string[]) => ids.map((id) => ({ id, name: id }))
const options: CollectionOptions = {
  factions: ["Ultramarines", "BlackLegion", "Aeldari"].map((id) => ({
    id,
    name: id,
    alliance: "Imperial",
  })),
  hits: [1, 2, 3, 4],
  movements: [2, 3, 4],
  ranges: [2, 3],
  damageTypes: named("Bolter", "Psychic"),
  traits: named("Psyker", "Flying", "Mechanical"),
  shardSources: ["Standard", "Elite", "none"],
}

function renderAt(
  entry: string,
  { catalogLoading = false }: { catalogLoading?: boolean } = {}
) {
  const catalog = catalogLoading ? undefined : options
  return renderHook(
    () => ({
      state: useCollectionQuery(catalog),
      location: useLocation(),
      navigationType: useNavigationType(),
    }),
    { route: "/my-game/collection", initialEntries: [entry] }
  )
}

describe("useCollectionQuery", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("starts from the default query without parameters", () => {
    const { result } = renderAt("/my-game/collection")
    expect(result.current.state.query).toEqual(defaultCollectionQuery)
  })

  it("reads every part of the query from the URL", () => {
    const { result } = renderAt(
      "/my-game/collection?q=ti&alliance=Xenos&faction=Aeldari,Ultramarines&rarity=Epic,Legendary&rankMin=Gold1&rankMax=Diamond3&owned=owned&kind=mow&quick=canAscend&sort=shards"
    )
    expect(result.current.state.query).toEqual({
      ...defaultCollectionQuery,
      search: "ti",
      alliance: "Xenos",
      factions: ["Aeldari", "Ultramarines"],
      rarities: ["Epic", "Legendary"],
      rankMin: "Gold1",
      rankMax: "Diamond3",
      ownership: "owned",
      kind: "mow",
      quick: "canAscend",
      sort: "shards",
    })
  })

  it("reads the stars range and the combat filters", () => {
    const { result } = renderAt(
      "/my-game/collection?starsMin=Legendary:RedThreeStars&attack=ranged&hitsMin=2&hitsMax=3&move=3&rangeMax=2&damage=Bolter,Psychic&trait=Psyker&source=Elite,none"
    )
    expect(result.current.state.query).toMatchObject({
      starsMin: "Legendary:RedThreeStars",
      starsMax: null,
      attack: "ranged",
      hitsMin: 2,
      hitsMax: 3,
      movement: 3,
      rangeMin: null,
      rangeMax: 2,
      damageTypes: ["Bolter", "Psychic"],
      traits: ["Psyker"],
      shardSources: ["Elite", "none"],
    })
    expect(result.current.location.search).toContain("source=Elite")
  })

  it("drops an unknown trait and a number the catalog does not offer", () => {
    const { result } = renderAt(
      "/my-game/collection?trait=Psyker,Teleporter&move=9&hitsMin=x"
    )
    expect(result.current.state.query).toMatchObject({
      traits: ["Psyker"],
      movement: null,
      hitsMin: null,
    })
    expect(result.current.location.search).toBe("?trait=Psyker")
  })

  it("swaps a hits range set backwards", () => {
    const { result } = renderAt("/my-game/collection?hitsMin=4&hitsMax=2")
    expect(result.current.state.query).toMatchObject({
      hitsMin: 2,
      hitsMax: 4,
    })
    expect(result.current.location.search).toBe("?hitsMin=2&hitsMax=4")
  })

  it("keeps catalog-checked values while the catalog loads", () => {
    const { result } = renderAt("/my-game/collection?trait=Psyker&move=3", {
      catalogLoading: true,
    })
    expect(result.current.state.query).toMatchObject({
      traits: [],
      movement: null,
    })
    expect(result.current.location.search).toBe("?trait=Psyker&move=3")
  })

  it("writes changes to the URL so a reload restores them", () => {
    const first = renderAt("/my-game/collection")
    act(() =>
      first.result.current.state.update({
        alliance: "Xenos",
        quick: "canAscend",
        sort: "shards",
      })
    )
    const reloaded = first.result.current.location
    expect(first.result.current.navigationType).toBe("REPLACE")
    first.unmount()

    const second = renderAt(`${reloaded.pathname}${reloaded.search}`)
    expect(second.result.current.state.query).toMatchObject({
      alliance: "Xenos",
      quick: "canAscend",
      sort: "shards",
    })
  })

  it("removes an invalid value from the URL and does not apply it", () => {
    const { result } = renderAt(
      "/my-game/collection?quick=readyToAscend&alliance=Chaos"
    )
    expect(result.current.state.query.quick).toBeNull()
    expect(result.current.location.search).toBe("?alliance=Chaos")
  })

  it("fixes several invalid values in one replacement", () => {
    const { result } = renderAt(
      "/my-game/collection?alliance=bogus&kind=bogus&sort=bogus&owned=owned"
    )
    expect(result.current.state.query).toMatchObject({
      alliance: null,
      kind: null,
      sort: "rarity",
      ownership: "owned",
    })
    expect(result.current.location.search).toBe("?owned=owned")
  })

  it("keeps the valid items of a list with an unknown one", () => {
    const { result } = renderAt(
      "/my-game/collection?faction=BlackLegion,RemovedFaction,Aeldari&rarity=Epic,Shiny"
    )
    expect(result.current.state.query).toMatchObject({
      factions: ["BlackLegion", "Aeldari"],
      rarities: ["Epic"],
    })
    expect(
      new URLSearchParams(result.current.location.search).get("faction")
    ).toBe("BlackLegion,Aeldari")
    expect(
      new URLSearchParams(result.current.location.search).get("rarity")
    ).toBe("Epic")
  })

  it("swaps a rank range set backwards", () => {
    const { result } = renderAt(
      "/my-game/collection?rankMin=Diamond3&rankMax=Stone1"
    )
    expect(result.current.state.query).toMatchObject({
      rankMin: "Stone1",
      rankMax: "Diamond3",
    })
    expect(result.current.location.search).toBe(
      "?rankMin=Stone1&rankMax=Diamond3"
    )
  })

  it("keeps an unknown-yet faction list while the catalog loads", () => {
    const { result } = renderAt("/my-game/collection?faction=Aeldari", {
      catalogLoading: true,
    })
    expect(result.current.state.query.factions).toEqual([])
    expect(result.current.location.search).toBe("?faction=Aeldari")
  })

  it("applies the remembered sort when the URL has none", () => {
    const first = renderAt("/my-game/collection")
    act(() => first.result.current.state.update({ sort: "rank" }))
    first.unmount()

    const fresh = renderAt("/my-game/collection")
    expect(fresh.result.current.state.query).toEqual({
      ...defaultCollectionQuery,
      sort: "rank",
    })
  })

  it("lets the URL sort win over the remembered one", () => {
    localStorage.setItem("collection.sort", "rank")
    const { result } = renderAt("/my-game/collection?sort=abilities")
    expect(result.current.state.query.sort).toBe("abilities")
  })

  it("clears every filter in one replacement and keeps the sort", () => {
    const { result } = renderAt(
      "/my-game/collection?q=ti&alliance=Imperial&quick=needToLevel&sort=rank"
    )
    const historyLength = window.history.length
    act(() => result.current.state.clear())

    expect(result.current.state.query).toEqual({
      ...defaultCollectionQuery,
      sort: "rank",
    })
    expect(result.current.location.search).toBe("?sort=rank")
    expect(result.current.navigationType).toBe("REPLACE")
    expect(window.history.length).toBe(historyLength)
  })

  describe("view", () => {
    it("keeps the default Cards view out of the URL", () => {
      const { result } = renderAt("/my-game/collection?view=roster")
      act(() => result.current.state.update({ view: "cards" }))
      expect(result.current.state.query.view).toBe("cards")
      expect(result.current.location.search).toBe("")
    })

    it("writes the view to the URL so a reload restores it", () => {
      const first = renderAt("/my-game/collection")
      act(() => first.result.current.state.update({ view: "roster" }))
      const reloaded = first.result.current.location
      expect(reloaded.search).toBe("?view=roster")
      expect(first.result.current.navigationType).toBe("REPLACE")
      first.unmount()
      localStorage.clear()

      const second = renderAt(`${reloaded.pathname}${reloaded.search}`)
      expect(second.result.current.state.query.view).toBe("roster")
    })

    it("applies the remembered view when the URL has none", () => {
      const first = renderAt("/my-game/collection")
      act(() => first.result.current.state.update({ view: "roster" }))
      first.unmount()

      const fresh = renderAt("/my-game/collection")
      expect(fresh.result.current.state.query).toEqual({
        ...defaultCollectionQuery,
        view: "roster",
      })
    })

    it("removes an unknown view and shows the remembered one", () => {
      localStorage.setItem("collection.view", "roster")
      const { result } = renderAt("/my-game/collection?view=gallery&kind=mow")
      expect(result.current.state.query.view).toBe("roster")
      expect(result.current.location.search).toBe("?kind=mow")
    })

    it("does not remember a view that arrived in a link", () => {
      const linked = renderAt("/my-game/collection?view=roster")
      expect(linked.result.current.state.query.view).toBe("roster")
      linked.unmount()

      const fresh = renderAt("/my-game/collection")
      expect(fresh.result.current.state.query.view).toBe("cards")
    })

    it("keeps the view when filters are cleared", () => {
      const { result } = renderAt(
        "/my-game/collection?q=ti&quick=needToLevel&view=roster"
      )
      act(() => result.current.state.clear())
      expect(result.current.state.query.view).toBe("roster")
      expect(result.current.location.search).toBe("?view=roster")
    })
  })

  it("keeps Hide unowned when filters are cleared", () => {
    const { result } = renderAt("/my-game/collection?owned=owned&q=ti")
    act(() => result.current.state.clear())
    expect(result.current.location.search).toBe("?owned=owned")
  })

  it("drops the removed Not owned value from an old link", () => {
    const { result } = renderAt("/my-game/collection?owned=unowned&kind=mow")
    expect(result.current.state.query.ownership).toBeNull()
    expect(result.current.location.search).toBe("?kind=mow")
  })

  describe("grouping", () => {
    it("keeps the default faction grouping out of the URL", () => {
      const { result } = renderAt("/my-game/collection?group=none")
      expect(result.current.state.query.group).toBe("none")
      act(() => result.current.state.update({ group: "faction" }))
      expect(result.current.location.search).toBe("")
    })

    it("applies the remembered grouping when the URL has none", () => {
      const first = renderAt("/my-game/collection")
      act(() => first.result.current.state.update({ group: "none" }))
      expect(first.result.current.location.search).toBe("?group=none")
      first.unmount()

      const fresh = renderAt("/my-game/collection")
      expect(fresh.result.current.state.query).toEqual({
        ...defaultCollectionQuery,
        group: "none",
      })
    })

    it("removes an unknown grouping and does not remember a linked one", () => {
      const bad = renderAt("/my-game/collection?group=alliance")
      expect(bad.result.current.state.query.group).toBe("faction")
      expect(bad.result.current.location.search).toBe("")
      bad.unmount()

      const linked = renderAt("/my-game/collection?group=none")
      expect(linked.result.current.state.query.group).toBe("none")
      linked.unmount()
      const fresh = renderAt("/my-game/collection")
      expect(fresh.result.current.state.query.group).toBe("faction")
    })

    it("keeps the grouping when filters are cleared", () => {
      const { result } = renderAt("/my-game/collection?q=ti&group=none")
      act(() => result.current.state.clear())
      expect(result.current.location.search).toBe("?group=none")
    })
  })
})
