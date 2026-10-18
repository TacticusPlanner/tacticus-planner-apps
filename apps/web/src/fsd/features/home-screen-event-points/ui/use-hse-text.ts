import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import type { HseText, HseTextValue } from "../lib/hse-description"

/** Every namespace a description line can reach into. */
const NAMESPACES = ["dailies", "common", "traits", "factions", "npcs"] as const

/**
 * Turns description data (`hseDescriptionLines`) into the player's language: nested texts are
 * translated first, lists are joined with the locale's list format, and numbers other than the
 * plural `count` are formatted for the locale.
 */
export function useHseText(): (text: HseText) => string {
  const { t, i18n } = useTranslation([...NAMESPACES])
  const language = i18n.language

  return useCallback(
    (root: HseText) => {
      const numbers = new Intl.NumberFormat(language)
      const lists = {
        and: new Intl.ListFormat(language, { type: "conjunction" }),
        or: new Intl.ListFormat(language, { type: "disjunction" }),
      }
      const render = (text: HseText): string => {
        const values: Record<string, string | number> = {}
        for (const [name, value] of Object.entries(text.values ?? {}))
          values[name] = renderValue(name, value)
        const translate = t as unknown as (
          key: string,
          options: Record<string, unknown>
        ) => string
        return translate(text.key, {
          ...values,
          ...(text.fallback === undefined
            ? {}
            : { defaultValue: text.fallback }),
        })
      }
      const renderValue = (name: string, value: HseTextValue) => {
        if (typeof value === "number")
          return name === "count" ? value : numbers.format(value)
        if ("list" in value) {
          const items = value.list.map(render)
          return value.join === "space"
            ? items.join(" ")
            : lists[value.join].format(items)
        }
        return render(value)
      }
      return render(root)
    },
    [t, language]
  )
}
