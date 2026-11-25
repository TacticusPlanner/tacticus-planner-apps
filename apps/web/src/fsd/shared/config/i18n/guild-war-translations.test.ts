import { describe, expect, it } from "vitest"

import { compareCodeUnits } from "../../lib"

import deCommon from "../../../../../public/locales/de/common.json"
import de from "../../../../../public/locales/de/guildWar.json"
import enCommon from "../../../../../public/locales/en/common.json"
import en from "../../../../../public/locales/en/guildWar.json"
import esCommon from "../../../../../public/locales/es/common.json"
import es from "../../../../../public/locales/es/guildWar.json"
import frCommon from "../../../../../public/locales/fr/common.json"
import fr from "../../../../../public/locales/fr/guildWar.json"

function leaves(value: unknown, prefix = ""): [string, unknown][] {
  if (typeof value !== "object" || value === null) return [[prefix, value]]
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, prefix ? `${prefix}.${key}` : key)
  )
}

const placeholders = (text: unknown) =>
  (String(text).match(/\{\{\w+\}\}/g) ?? []).toSorted(compareCodeUnits)

/** The Guild War copy that lives in `common.json`: its nav group and tabs. */
const commonGuildWar = (locale: typeof enCommon) => ({
  group: locale.guild.groups.guildWar,
  offense: locale.guild.tabs.warOffense,
  offenseDescription: locale.guild.tabs.warOffenseDescription,
  history: locale.guild.tabs.warHistory,
  historyDescription: locale.guild.tabs.warHistoryDescription,
})

const sources = {
  guildWar: { en, translated: { de, es, fr } },
  common: {
    en: commonGuildWar(enCommon),
    translated: {
      de: commonGuildWar(deCommon),
      es: commonGuildWar(esCommon),
      fr: commonGuildWar(frCommon),
    },
  },
}

// Number-only formats and words that read the same in a translation.
const SAME_AS_ENGLISH = new Set([
  "summary.tokensValue",
  "summary.resultsValue",
  "target.zone",
  "tour.log.title",
])

describe.each(Object.entries(sources))(
  "Guild War translations: %s",
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
