import { ArrowDown } from "lucide-react"
import { useId } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { objectiveDetailId } from "./objective-detail-id"

/** What an objective's suggestion points at: its raids, its battles by hand, or a token mode's team. */
type HreSuggestionKind =
  "raids" | "battles" | "arena" | "onslaught" | "salvageRun" | "guildRaid"

/** One suggestion for an objective: a one-row summary under it, and its details further down. */
export type ObjectiveSuggestion = {
  /** Unique among the objective's suggestions; also the test id suffix of its row and details. */
  id: string
  suggestion: HreSuggestionKind
  /** A manual objective played with spare tokens. */
  spare?: boolean
  summary: ReactNode
  /** The details card, shown in the mission's suggestions section (`ObjectiveDetails`). */
  detail: ReactNode
}

/** An objective's suggestions, or a line saying where they are (shared with the other objective). */
export type ObjectiveSuggestions = {
  items: readonly ObjectiveSuggestion[]
  /** A line under the rows, or alone (the battles above count for this objective too). */
  note?: string | null
}

function scrollToDetail(id: string) {
  const reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  document.getElementById(id)?.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  })
}

/**
 * The suggestions under one objective: one row each, with an arrow. A row scrolls the page to its
 * details in the mission's suggestions section; `onOpen` reports each row tapped. The rows sit in a
 * labelled, indented block with a muted fill, so they read as help for the objective above rather
 * than another objective.
 */
export function ObjectiveSuggestionRows({
  suggestions: { items, note },
  index,
  testId,
  onOpen,
}: {
  suggestions: ObjectiveSuggestions
  /** The objective's index in the mission, for the details' ids. */
  index: number
  testId: string
  onOpen?: (item: ObjectiveSuggestion) => void
}) {
  const { t } = useTranslation("hre")
  const labelId = useId()
  if (items.length === 0 && !note) return null
  return (
    <div
      className="ms-2 mt-2 space-y-1.5 border-s-2 ps-3"
      data-testid={`${testId}-suggestions`}
    >
      {items.length > 0 ? (
        <>
          <p className="text-xs font-medium text-muted-foreground" id={labelId}>
            {t("tracker.detailsTitle")}
          </p>
          <ul
            aria-labelledby={labelId}
            className="divide-y divide-background rounded-lg bg-muted/50"
          >
            {items.map((item) => (
              <li key={item.id} data-testid={`${testId}-suggestion-${item.id}`}>
                <button
                  className="flex min-h-12 w-full items-center gap-2 rounded-lg interactive-surface px-3 py-2 text-left text-sm md:min-h-8"
                  data-testid={`${testId}-suggestion-${item.id}-trigger`}
                  onClick={() => {
                    scrollToDetail(objectiveDetailId(index, item.id))
                    onOpen?.(item)
                  }}
                  type="button"
                >
                  {item.summary}
                  <ArrowDown
                    aria-hidden="true"
                    className="size-icon-sm shrink-0 text-muted-foreground"
                  />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {note ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid={`${testId}-suggestions-note`}
        >
          {note}
        </p>
      ) : null}
    </div>
  )
}
