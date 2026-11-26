import { describe, expect, it } from "vitest"

import { compareCodeUnits } from "../../lib"

import deCommon from "../../../../../public/locales/de/common.json"
import de from "../../../../../public/locales/de/survival.json"
import enCommon from "../../../../../public/locales/en/common.json"
import en from "../../../../../public/locales/en/survival.json"
import esCommon from "../../../../../public/locales/es/common.json"
import es from "../../../../../public/locales/es/survival.json"
import frCommon from "../../../../../public/locales/fr/common.json"
import fr from "../../../../../public/locales/fr/survival.json"

function leaves(value: unknown, prefix = ""): [string, unknown][] {
  if (typeof value !== "object" || value === null) return [[prefix, value]]
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, prefix ? `${prefix}.${key}` : key)
  )
}

const placeholders = (text: unknown) =>
  (String(text).match(/\{\{\w+\}\}/g) ?? []).toSorted(compareCodeUnits)

/** The Survival copy that lives in `common.json`: its Plan tab. */
const commonSurvival = (locale: typeof enCommon) => ({
  tab: locale.goals.tabs.survival,
  description: locale.goals.tabs.survivalDescription,
})

const sources = {
  survival: { en, translated: { de, es, fr } },
  common: {
    en: commonSurvival(enCommon),
    translated: {
      de: commonSurvival(deCommon),
      es: commonSurvival(esCommon),
      fr: commonSurvival(frCommon),
    },
  },
}

// Number-only formats, proper names and words that read the same in a translation.
const SAME_AS_ENGLISH = new Set([
  "switcher.option",
  "events.crescendo-a",
  "events.crescendo-b",
  "medals.bronze",
  "medals.gold",
  "buffs.Killzone",
  "tabs.team",
  "tabs.missions",
  "enemies.score",
  "tour.missions.title",
  "tour.missions.content",
])

describe.each(Object.entries(sources))(
  "Survival translations: %s",
  (_name, source) => {
    const english = new Map(leaves(source.en))

    it.each(Object.entries(source.translated))(
      "keeps %s aligned with English keys and placeholders",
      (_locale, resource) => {
        const translated = new Map(leaves(resource))
        expect([...translated.keys()].toSorted(compareCodeUnits)).toEqual(
          [...english.keys()].toSorted(compareCodeUnits)
        )
        for (const [key, text] of translated) {
          expect(typeof text, key).toBe("string")
          expect(String(text).trim(), key).not.toBe("")
          expect(placeholders(text), key).toEqual(
            placeholders(english.get(key))
          )
        }
      }
    )

    it.each(Object.entries(source.translated))(
      "actually translates %s",
      (_locale, resource) => {
        const copied = leaves(resource)
          .filter(([key, text]) => english.get(key) === text)
          .map(([key]) => key)
          .filter((key) => !SAME_AS_ENGLISH.has(key))
        expect(copied).toEqual([])
      }
    )
  }
)
