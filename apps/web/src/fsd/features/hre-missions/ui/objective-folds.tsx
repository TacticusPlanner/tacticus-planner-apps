import { useRef } from "react"
import type { ReactNode } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

/** What an objective's fold suggests: its raids, its battles by hand, or a token mode's team. */
type HreFoldSuggestion =
  "raids" | "battles" | "arena" | "onslaught" | "salvageRun" | "guildRaid"

/** One suggestion under an objective: a one-row summary that opens to its details. */
export type ObjectiveFold = {
  /** Unique among the objective's folds; also the fold's test id suffix. */
  id: string
  suggestion: HreFoldSuggestion
  /** A manual objective played with spare tokens. */
  spare?: boolean
  summary: ReactNode
  content: ReactNode
}

/** An objective's suggestions, or a line saying where they are (shared with the other objective). */
export type ObjectiveSuggestions = {
  folds: readonly ObjectiveFold[]
  /** A line under the folds, or alone (the battles above count for this objective too). */
  note?: string | null
}

/**
 * The suggestions under one objective: each folded to one row, closed by default every time, with a
 * chevron to open its details. `onOpen` reports each fold as it opens.
 */
export function ObjectiveFolds({
  suggestions: { folds, note },
  testId,
  onOpen,
}: {
  suggestions: ObjectiveSuggestions
  testId: string
  onOpen?: (fold: ObjectiveFold) => void
}) {
  const open = useRef<readonly string[]>([])
  if (folds.length === 0 && !note) return null
  return (
    <div className="space-y-1.5" data-testid={`${testId}-suggestions`}>
      {folds.length > 0 ? (
        <Accordion
          className="rounded-lg"
          onValueChange={(value: string[]) => {
            const opened = folds.filter(
              (fold) =>
                value.includes(fold.id) && !open.current.includes(fold.id)
            )
            open.current = value
            for (const fold of opened) onOpen?.(fold)
          }}
          type="multiple"
        >
          {folds.map((fold) => (
            <AccordionItem
              key={fold.id}
              data-testid={`${testId}-fold-${fold.id}`}
              value={fold.id}
            >
              <AccordionTrigger
                className="items-center gap-2 px-3 py-2 font-normal hover:no-underline"
                data-testid={`${testId}-fold-${fold.id}-trigger`}
              >
                {fold.summary}
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-1">
                {fold.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
