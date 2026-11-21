import { useTranslation } from "react-i18next"

import type { HseText, HseTextValue } from "@/entities/home-screen-event"

/** Every namespace a description line can reach into. */
const NAMESPACES = [
  "dailies",
  "common",
  "traits",
  "factions",
  "npcs",
  "progression",
] as const

type Translate = (key: string, options: Record<string, unknown>) => string

/**
 * Renders description data to a string: nested texts are translated first, lists are joined with
 * the locale's list format, and numbers other than the plural `count` are formatted for the locale.
 * `leaf` sees every nested text once it is translated and may stand in a marker for it (the rich
 * form swaps markers for icon-led labels).
 */
export function renderHseText(
  translate: Translate,
  language: string,
  root: HseText,
  leaf: (text: HseText, label: string) => string = (_text, label) => label
): string {
  const numbers = new Intl.NumberFormat(language)
  const lists = {
    and: new Intl.ListFormat(language, { type: "conjunction" }),
    or: new Intl.ListFormat(language, { type: "disjunction" }),
  }
  const render = (text: HseText): string => {
    const values: Record<string, string | number> = {}
    for (const [name, value] of Object.entries(text.values ?? {}))
      values[name] = renderValue(name, value)
    const label = translate(text.key, {
      ...values,
      ...(text.fallback === undefined ? {} : { defaultValue: text.fallback }),
    })
    return text === root ? label : leaf(text, label)
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
}

/** The translate function and language every description line renders with. */
export function useHseTranslate(): { translate: Translate; language: string } {
  const { t, i18n } = useTranslation([...NAMESPACES])
  return { translate: t as unknown as Translate, language: i18n.language }
}
