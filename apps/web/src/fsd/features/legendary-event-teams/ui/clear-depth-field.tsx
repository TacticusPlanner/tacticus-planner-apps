import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { ClearEstimate } from "@/entities/legendary-event"

import { clearDepthDisplay } from "../model/clear-depth-display"
import { ClearDepthStepper } from "./clear-depth-stepper"

/**
 * A team's clear depth for the current run with its estimate (design D5): without a manual depth
 * the stepper shows the estimate marked "estimated" (with "uncalibrated" in its tooltip while the
 * dataset has no samples) and its margin line, and − / + start from it; with a manual depth it
 * shows a muted "estimate ~n" hint and Use estimate, which clears the manual depth (`onChange`
 * null). Without an estimate it is the plain manual stepper with its clear control.
 */
export function ClearDepthField({
  value,
  estimate,
  lockedMemberCount,
  battleCount,
  onChange,
  disabled = false,
  align = "end",
  "data-testid": testId = "clear-depth",
}: {
  /** The current run's manual depth, or null. */
  value: number | null
  estimate: ClearEstimate | null
  /** Members the roster does not hold (not counted in the estimate). */
  lockedMemberCount: number
  battleCount: number
  onChange: (depth: number | null) => void
  disabled?: boolean
  /** Which edge the stepper and its lines hug: the card's right edge, or the editor's left. */
  align?: "start" | "end"
  "data-testid"?: string
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const display = clearDepthDisplay(value, estimate)
  const start = align === "start"

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1",
        start ? "items-start" : "items-end"
      )}
      data-estimated={display.kind === "estimate" ? "true" : undefined}
      data-testid={testId}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          start ? "justify-start" : "justify-end"
        )}
      >
        {display.kind === "estimate" ? (
          <span
            className="rounded-full border border-dashed px-1.5 text-xs text-muted-foreground"
            data-testid={`${testId}-estimated`}
            title={
              display.estimate.calibrated
                ? t("estimates.howItWorks")
                : t("estimates.uncalibrated")
            }
          >
            {t("estimates.estimated")}
            {display.estimate.calibrated ? null : (
              <span className="sr-only">
                {` · ${t("estimates.uncalibrated")}`}
              </span>
            )}
          </span>
        ) : null}
        <ClearDepthStepper
          battleCount={battleCount}
          clearable={!estimate}
          data-testid={`${testId}-stepper`}
          disabled={disabled}
          onChange={onChange}
          value={display.stepperValue}
        />
      </div>
      {display.kind === "estimate" ? (
        <p
          className={cn(
            "text-xs text-muted-foreground tabular-nums",
            start ? "text-left" : "text-right"
          )}
          data-testid={`${testId}-margin`}
        >
          {[
            display.estimate.depth === 0
              ? t("estimates.notEnough")
              : t("estimates.marginAbove", {
                  percent: number.format(display.estimate.marginAbovePct ?? 0),
                  battle: display.estimate.depth,
                }),
            display.estimate.shortfallToNextPct === null
              ? null
              : t("estimates.shortfallNext", {
                  percent: number.format(display.estimate.shortfallToNextPct),
                  battle: display.estimate.depth + 1,
                }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
      {display.kind === "manual" && estimate ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            start ? "justify-start" : "justify-end"
          )}
        >
          <span
            className="text-xs text-muted-foreground tabular-nums"
            data-testid={`${testId}-hint`}
          >
            {t("estimates.estimateHint", { depth: estimate.depth })}
          </span>
          <Button
            className="h-auto px-1.5 py-0.5 text-xs"
            data-testid={`${testId}-use-estimate`}
            disabled={disabled}
            onClick={() => onChange(null)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {t("estimates.useEstimate")}
          </Button>
        </div>
      ) : null}
      {estimate && lockedMemberCount > 0 ? (
        <p
          className={cn(
            "text-xs text-muted-foreground",
            start ? "text-left" : "text-right"
          )}
          data-testid={`${testId}-locked`}
        >
          {t("estimates.lockedNotCounted", { count: lockedMemberCount })}
        </p>
      ) : null}
    </div>
  )
}
