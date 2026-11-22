import { useCallback } from "react"
import type { ReactNode } from "react"

import type { HseText } from "@/entities/home-screen-event"
import { EntityIcon } from "@/shared/ui"

import { hseTextIcon } from "../lib/hse-text-icon"
import { renderHseText, useHseTranslate } from "./use-hse-text"

// Private-use characters around a label's index mark where an icon-led label goes.
const OPEN = ""
const CLOSE = ""
const MARKER = new RegExp(`${OPEN}(\\d+)${CLOSE}`)

/**
 * Turns description data (`hseDescriptionLines`) into the player's language, with each faction,
 * alliance, trait and token mode led by its game icon: the line is translated as text (so word order follows the locale), then the labels are swapped back in with
 * their icons. The icons are decorative; the words still name each one.
 */
export function useHseRichText(): (text: HseText) => ReactNode {
  const { translate, language } = useHseTranslate()
  return useCallback(
    (root: HseText) => {
      const labels: { icon: string; label: string }[] = []
      const line = renderHseText(translate, language, root, (text, label) => {
        const icon = hseTextIcon(text.key)
        if (icon === undefined) return label
        labels.push({ icon, label })
        return `${OPEN}${labels.length - 1}${CLOSE}`
      })
      // split() with a capture group alternates text and captured indices.
      return line.split(MARKER).map((part, index) => {
        if (index % 2 === 0) return part
        const entry = labels[Number(part)]
        if (!entry) return null
        return (
          <span key={index} className="whitespace-nowrap">
            <EntityIcon
              size="inline"
              src={entry.icon}
              alt=""
              className="mr-0.5 inline-block align-text-bottom"
            />
            {entry.label}
          </span>
        )
      })
    },
    [translate, language]
  )
}
