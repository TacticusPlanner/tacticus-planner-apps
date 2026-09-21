import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const translations: Record<string, string> = {
  "characters:hero-translated": "Translated Hero",
  "mows:mow-translated": "Translated Mow",
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      translations[key] ?? opts?.defaultValue ?? key,
  }),
}))

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (querier: () => unknown) => querier(),
}))

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: () =>
    new Map([
      ["hero-translated", { id: "hero-translated", name: "Catalog Hero" }],
      ["hero-plain", { id: "hero-plain", name: "Catalog Only Hero" }],
    ]),
  getMowsMap: () =>
    new Map([
      ["mow-1", { id: "mow-1", name: "Stormbird" }],
      ["mow-translated", { id: "mow-translated", name: "Catalog Mow" }],
    ]),
}))

import { useUnitName } from "./use-unit-name"

function getResolver() {
  return renderHook(() => useUnitName()).result.current
}

describe("useUnitName", () => {
  it("resolves a Character through the characters namespace", () => {
    expect(getResolver()("Character", "hero-translated")).toBe(
      "Translated Hero"
    )
  })

  it("falls back to the catalog record's name for an untranslated Character", () => {
    expect(getResolver()("Character", "hero-plain")).toBe("Catalog Only Hero")
  })

  it("resolves a Mow through the mows namespace", () => {
    expect(getResolver()("Mow", "mow-translated")).toBe("Translated Mow")
  })

  it("falls back to the catalog record's name for an untranslated Mow", () => {
    expect(getResolver()("Mow", "mow-1")).toBe("Stormbird")
  })

  it("falls back to the raw id for a unit the catalog doesn't know", () => {
    expect(getResolver()("Character", "unknownHero")).toBe("unknownHero")
    expect(getResolver()("Mow", "unknownMow")).toBe("unknownMow")
  })

  it("falls back to the raw id for an unknown entity type", () => {
    expect(getResolver()("Upgrade", "some-upgrade")).toBe("some-upgrade")
  })

  it("returns an empty string for a null id", () => {
    expect(getResolver()("Character", null)).toBe("")
    expect(getResolver()(null, null)).toBe("")
  })
})
