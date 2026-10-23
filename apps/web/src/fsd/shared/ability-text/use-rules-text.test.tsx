import { act, renderHook, waitFor } from "@testing-library/react"
import i18next, { type BackendModule } from "i18next"
import { initReactI18next } from "react-i18next"
import { describe, expect, it } from "vitest"

import { i18nWrapper } from "@/test/i18n"

import { useAbilityText, useTraitText } from "./use-ability-text"

const entry = (description: string) => ({
  description,
  variables: {},
  constants: {},
  scaled: [],
})

/** An instance whose backend serves `files` (`<lng>/<ns>` -> data) and fails everything else. */
async function setup(lng: "en" | "de", files: Record<string, unknown>) {
  const requests: string[] = []
  const backend: BackendModule = {
    type: "backend",
    init() {},
    read(language, namespace, callback) {
      const key = `${language}/${namespace}`
      requests.push(key)
      const data = files[key]
      setTimeout(() =>
        data === undefined
          ? callback(new Error(`404 ${key}`), false)
          : callback(null, data as never)
      )
    },
  }
  const instance = i18next.createInstance()
  await instance
    .use(backend)
    .use(initReactI18next)
    .init({
      lng,
      fallbackLng: "en",
      // The default namespace is bundled (as `common` is in the app), so only rules text loads.
      partialBundledLanguages: true,
      resources: { en: { translation: {} }, de: { translation: {} } },
      react: { useSuspense: false },
    })
  return { instance, requests, files }
}

const gaps = { "en/npcAbilityTextGaps": ["NoText"] }

describe("useAbilityText", () => {
  it("loads only the given abilities, reporting loading then ready", async () => {
    const { instance, requests } = await setup("en", {
      ...gaps,
      "en/npcAbilityText/Shown": { Shown: entry("Shown text") },
      "en/npcAbilityText/Other": { Other: entry("Other text") },
    })
    const { result } = renderHook(() => useAbilityText(["Shown"]), {
      wrapper: i18nWrapper(instance),
    })
    expect(result.current.ready).toBe(false)
    expect(result.current.text("Shown")).toBeUndefined()

    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.failed).toBe(false)
    expect(result.current.text("Shown")?.description).toBe("Shown text")
    expect(requests).toEqual([
      "en/npcAbilityTextGaps",
      "en/npcAbilityText/Shown",
    ])
  })

  it("falls back to English when the active language has no file", async () => {
    const { instance } = await setup("de", {
      ...gaps,
      "en/npcAbilityText/Shown": { Shown: entry("English text") },
      "en/npcAbilityText/Both": { Both: entry("English both") },
      "de/npcAbilityText/Both": { Both: entry("Deutscher Text") },
    })
    const { result } = renderHook(() => useAbilityText(["Shown", "Both"]), {
      wrapper: i18nWrapper(instance),
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.failed).toBe(false)
    expect(result.current.text("Shown")?.description).toBe("English text")
    expect(result.current.text("Both")?.description).toBe("Deutscher Text")
  })

  it("never requests a known gap and reads it as missing text, not a failure", async () => {
    const { instance, requests } = await setup("en", gaps)
    const { result } = renderHook(() => useAbilityText(["NoText"]), {
      wrapper: i18nWrapper(instance),
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.failed).toBe(false)
    expect(result.current.text("NoText")).toBeUndefined()
    expect(requests).toEqual(["en/npcAbilityTextGaps"])
  })

  it("reports a failed download, and retry fetches it again", async () => {
    const { instance, requests, files } = await setup("en", gaps)
    const { result } = renderHook(() => useAbilityText(["Flaky"]), {
      wrapper: i18nWrapper(instance),
    })
    await waitFor(() => expect(result.current.failed).toBe(true))
    expect(result.current.text("Flaky")).toBeUndefined()

    files["en/npcAbilityText/Flaky"] = { Flaky: entry("Back") }
    act(() => result.current.retry())
    expect(result.current.ready).toBe(false)
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.failed).toBe(false)
    expect(result.current.text("Flaky")?.description).toBe("Back")
    expect(
      requests.filter((key) => key === "en/npcAbilityText/Flaky").length
    ).toBeGreaterThan(1)
  })
})

describe("useTraitText", () => {
  it("loads the whole trait namespace and reads entries from it", async () => {
    const { instance, requests } = await setup("en", {
      "en/npcTraitText": { Flying: entry("Flies") },
    })
    const { result } = renderHook(() => useTraitText(), {
      wrapper: i18nWrapper(instance),
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.text("Flying")?.description).toBe("Flies")
    expect(requests).toEqual(["en/npcTraitText"])
  })

  it("reports a failed download", async () => {
    const { instance } = await setup("en", {})
    const { result } = renderHook(() => useTraitText(), {
      wrapper: i18nWrapper(instance),
    })
    await waitFor(() => expect(result.current.failed).toBe(true))
  })
})
