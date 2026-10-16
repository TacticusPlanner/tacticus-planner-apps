import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

import type { LegendaryEventAnnotationStatus } from "@/entities/legendary-event"

import { AnnotationMarkIcon } from "./annotation-mark"

const CHOICES = ["none", "maybeClear", "stopHere"] as const
type Choice = (typeof CHOICES)[number]

/**
 * A not-cleared grid cell as the control for its mark (design D9): a button showing the mark in
 * effect (V1's icon, or the plain not-cleared ring) with "not cleared" / "not cleared, marked …"
 * text, opening a three-item menu — Not marked, Maybe clear, Stop here — with the current choice
 * checked. The menu is anchored to the cell; `touch` gives its rows 40px.
 */
export function AnnotationMenu({
  objective,
  battle,
  status,
  onChange,
  touch = false,
}: {
  /** The objective's label (the column). */
  objective: string
  /** 1-based battle number. */
  battle: number
  status: LegendaryEventAnnotationStatus | null
  onChange: (status: LegendaryEventAnnotationStatus | null) => void
  touch?: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const text =
    status === null
      ? t("progress.cellNotCleared", { objective })
      : t(`annotations.cell.${status}`, { objective })
  const label = (choice: Choice) =>
    choice === "none" ? t("annotations.notMarked") : t(`annotations.${choice}`)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            touch ? "size-10" : "size-6",
            status === null &&
              "border border-dashed border-muted-foreground/40 hover:border-muted-foreground"
          )}
          data-cleared="false"
          data-mark={status ?? "none"}
          data-testid="progress-cell"
          title={text}
          type="button"
        >
          {status === null ? null : (
            <AnnotationMarkIcon className="size-5" status={status} />
          )}
          <span className="sr-only">{text}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" data-testid="annotation-menu">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t("annotations.menuLabel", { objective, battle })}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          onValueChange={(value) =>
            onChange(
              value === "none" ? null : (value as Exclude<Choice, "none">)
            )
          }
          value={status ?? "none"}
        >
          {CHOICES.map((choice) => (
            <DropdownMenuRadioItem
              className={cn(touch && "min-h-10")}
              data-testid={`annotation-choice-${choice}`}
              key={choice}
              value={choice}
            >
              {choice === "none" ? null : (
                <AnnotationMarkIcon status={choice} />
              )}
              {label(choice)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
