import { describe, expect, it } from "vitest"

import { compareCodeUnits } from "../../lib"

import deCommon from "../../../../../public/locales/de/common.json"
import de from "../../../../../public/locales/de/teams.json"
import enCommon from "../../../../../public/locales/en/common.json"
import en from "../../../../../public/locales/en/teams.json"
import esCommon from "../../../../../public/locales/es/common.json"
import es from "../../../../../public/locales/es/teams.json"
import frCommon from "../../../../../public/locales/fr/common.json"
import fr from "../../../../../public/locales/fr/teams.json"

function leaves(value: unknown, prefix = ""): [string, unknown][] {
  if (typeof value !== "object" || value === null) return [[prefix, value]]
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, prefix ? `${prefix}.${key}` : key)
  )
}

const placeholders = (text: unknown) =>
  (String(text).match(/\{\{\w+\}\}/g) ?? []).toSorted(compareCodeUnits)

/** The Teams copy that lives in `common.json`: navigation and the V1 import part. */
const commonTeams = (locale: typeof enCommon) => ({
  tabs: {
    teams: locale.myGame.tabs.teams,
    teamsDescription: locale.myGame.tabs.teamsDescription,
  },
  part: locale.goals.v1Import.parts.teams,
  partDescription: locale.goals.v1Import.partDescriptions.teams,
  import: locale.goals.v1Import.teams,
})

const sources = {
  teams: { en, translated: { de, es, fr } },
  common: {
    en: commonTeams(enCommon),
    translated: {
      de: commonTeams(deCommon),
      es: commonTeams(esCommon),
      fr: commonTeams(frCommon),
    },
  },
}

// Loan words and number-only formats that may legitimately read the same as English.
const SAME_AS_ENGLISH = new Set([
  "modes.horde",
  "modes.incursion",
  "card.flex",
  "card.positionLabel",
  "lineup.flex",
  "table.label",
  "table.position",
  "table.team",
  "table.flex",
  "table.status",
  "table.actions",
  "page.groupByMode",
  // German uses the same word.
  "editor.tabDetails",
  "editor.notesCount",
  "editor.name",
  "editor.notes",
  "editor.modes",
  "page.mode",
  "picker.faction",
  "picker.alliance",
  "picker.trait",
  "incursion.label",
  "card.incursions",
  "tabs.teams",
  "part",
  "import.title",
])

describe.each(Object.entries(sources))(
  "Teams translations: %s",
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
      "actually translates %s, including rule, outcome and tour copy",
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
