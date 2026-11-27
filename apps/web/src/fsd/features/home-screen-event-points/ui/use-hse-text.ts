import { useTranslation } from "react-i18next"

import type { HseText, HseTextValue } from "@/entities/home-screen-event"
import { numberFormat } from "@/shared/lib"

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
  leaf: (text: HseText, label: string) => string = keepLabel
): string {
  const numbers = numberFormat(language)
  const lists = {
    and: new Intl.ListFormat(language, { type: "conjunction" }),
    or: new Intl.ListFormat(language, { type: "disjunction" }),
  }
  const render = (text: HseText, mark: typeof leaf): string => {
    const values: Record<string, string | number> = {}
    for (const [name, value] of Object.entries(text.values ?? {}))
      values[name] = renderValue(name, value, mark)
    const label = translate(text.key, {
      ...values,
      ...(text.fallback === undefined ? {} : { defaultValue: text.fallback }),
    })
    return text === root ? label : mark(text, label)
  }
  const renderValue = (
    name: string,
    value: HseTextValue,
    mark: typeof leaf
  ): string | number => {
    if (typeof value === "number")
      return name === "count" ? value : numbers.format(value)
    if ("list" in value) {
      const items = value.list.map((item) => render(item, mark))
      if (value.join === "space") return items.join(" ")
      // The list is formatted from the real labels, whose first letters can pick the joining word
      // (Spanish "y" becomes "e" before "Imperial"); the marked items then take their places.
      const labels =
        mark === keepLabel
          ? items
          : value.list.map((item) => render(item, keepLabel))
      let element = 0
      return lists[value.join]
        .formatToParts(labels)
        .map((part) =>
          part.type === "element" ? (items[element++] ?? "") : part.value
        )
        .join("")
    }
    return render(value, mark)
  }
  return render(root, leaf)
}

function keepLabel(_text: HseText, label: string): string {
  return label
}

/** The translate function and language every description line renders with. */
export function useHseTranslate(): { translate: Translate; language: string } {
  const { t, i18n } = useTranslation([...NAMESPACES])
  return { translate: t as unknown as Translate, language: i18n.language }
}
