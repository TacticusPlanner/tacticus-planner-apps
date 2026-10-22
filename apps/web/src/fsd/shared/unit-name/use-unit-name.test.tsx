import { beforeEach, describe, expect, it } from "vitest"

import { renderHook, waitFor } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { useUnitName } from "./use-unit-name"

// `adeptCanoness` / `ultraDreadnought` have real English translations ("Roswitha" / "Galatian");
// the other ids are absent from the locale files, so they exercise the catalog-name fallback.
beforeEach(async () => {
  await seedGameCatalog({
    characters: [
      { id: "adeptCanoness", name: "Catalog Hero" },
      { id: "hero-plain", name: "Catalog Only Hero" },
    ],
    mows: [
      { id: "mow-1", name: "Stormbird" },
      { id: "ultraDreadnought", name: "Catalog Mow" },
    ],
  })
})

async function getResolver() {
  const { result } = renderHook(() => useUnitName())
  await waitFor(() => {
    expect(result.current("Character", "hero-plain")).toBe("Catalog Only Hero")
    expect(result.current("Mow", "mow-1")).toBe("Stormbird")
  })
  return result.current
}

describe("useUnitName", () => {
  it("resolves a Character through the characters namespace", async () => {
    expect((await getResolver())("Character", "adeptCanoness")).toBe("Roswitha")
  })

  it("falls back to the catalog record's name for an untranslated Character", async () => {
    expect((await getResolver())("Character", "hero-plain")).toBe(
      "Catalog Only Hero"
    )
  })

  it("resolves a Mow through the mows namespace", async () => {
    expect((await getResolver())("Mow", "ultraDreadnought")).toBe("Galatian")
  })

  it("falls back to the catalog record's name for an untranslated Mow", async () => {
    expect((await getResolver())("Mow", "mow-1")).toBe("Stormbird")
  })

  it("falls back to the raw id for a unit the catalog doesn't know", async () => {
    const resolve = await getResolver()
    expect(resolve("Character", "unknownHero")).toBe("unknownHero")
    expect(resolve("Mow", "unknownMow")).toBe("unknownMow")
  })

  it("falls back to the raw id for an unknown entity type", async () => {
    expect((await getResolver())("Upgrade", "some-upgrade")).toBe(
      "some-upgrade"
    )
  })

  it("returns an empty string for a null id", async () => {
    const resolve = await getResolver()
    expect(resolve("Character", null)).toBe("")
    expect(resolve(null, null)).toBe("")
  })
})
