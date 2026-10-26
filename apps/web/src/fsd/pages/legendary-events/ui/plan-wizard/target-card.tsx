import type { KeyboardEvent, Ref } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import type { StepTarget, StepVerdict } from "./plan-ceiling"
import { targetBar } from "./target-step.model"

const VERDICT_CLASS: Record<StepVerdict["kind"], string> = {
  reachableNow: "border-transparent bg-success text-success-foreground",
  needsUpgrades: "border-transparent bg-info-bg",
  tooAmbitious: "border-destructive/40 bg-destructive/10 text-destructive",
}

/**
 * One offered step (spec: target step leads with the choice): a radio card with the step, its
 * points target, the verdict and a bar of the synced ceiling (solid) and the ceiling with every
 * recommended upgrade (hatched) against the target, capped at 100%. While the verdict is
 * rechecked it shows its last value dimmed with Checking.
 */
export function TargetCard({
  target,
  verdict,
  currentKind,
  checked,
  focusable,
  rechecking,
  syncedCeiling,
  upgradedCeiling,
  onSelect,
  onKeyDown,
  buttonRef,
}: {
  target: StepTarget
  /** The verdict shown (the last settled one while rechecking). */
  verdict: StepVerdict
  /** The live verdict, for tests and analytics. */
  currentKind: StepVerdict["kind"]
  checked: boolean
  /** The group's one tab stop. */
  focusable: boolean
  rechecking: boolean
  syncedCeiling: number
  upgradedCeiling: number
  onSelect: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
  buttonRef: Ref<HTMLButtonElement>
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const bar = targetBar(target, syncedCeiling, upgradedCeiling)
  const details: string[] = []
  if (target.kind === "points") {
    if (verdict.kind === "reachableNow") {
      details.push(
        t("planWizard.target.spare", { points: number.format(verdict.spare) })
      )
    } else {
      if (verdict.short !== null) {
        details.push(
          t("planWizard.target.short", {
            points: number.format(verdict.short),
          })
        )
      }
      if (upgradedCeiling > syncedCeiling) {
        details.push(
          upgradedCeiling >= target.points
            ? t("planWizard.target.spareWithUpgrades", {
                points: number.format(upgradedCeiling - target.points),
              })
            : t("planWizard.target.shortWithUpgrades", {
                points: number.format(target.points - upgradedCeiling),
              })
        )
      }
    }
  } else {
    details.push(t("planWizard.target.unreachable"))
  }
  const verdictLabel = rechecking
    ? t("planWizard.target.verdicts.checking")
    : t(`planWizard.target.verdicts.${verdict.kind}`)

  return (
    <button
      aria-checked={checked}
      className={cn(
        "flex min-h-11 w-full flex-col gap-2 rounded-xl border p-3 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        checked && "border-primary ring-1 ring-primary"
      )}
      data-step={target.step}
      data-testid="plan-wizard-target-option"
      data-verdict={currentKind}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      ref={buttonRef}
      role="radio"
      tabIndex={focusable ? 0 : -1}
      type="button"
    >
      <span className="flex w-full items-center gap-3">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium">
            {t(`outlook.steps.${target.step}`)}
          </span>
          {target.kind === "points" ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("planWizard.target.points", {
                points: number.format(target.points),
              })}
            </span>
          ) : null}
        </span>
        <Badge
          className={rechecking ? undefined : VERDICT_CLASS[verdict.kind]}
          data-testid="plan-wizard-verdict"
          variant="outline"
        >
          {verdictLabel}
        </Badge>
      </span>
      {bar ? (
        <span
          aria-hidden="true"
          className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-muted",
            rechecking && "opacity-60"
          )}
          data-testid="plan-wizard-target-bar"
        >
          <span
            className="absolute inset-y-0 left-0 bg-[repeating-linear-gradient(45deg,var(--primary)_0_4px,transparent_4px_8px)] opacity-60"
            data-testid="plan-wizard-target-bar-upgraded"
            style={{ width: `${bar.upgraded}%` }}
          />
          <span
            className="absolute inset-y-0 left-0 bg-primary"
            data-testid="plan-wizard-target-bar-synced"
            style={{ width: `${bar.synced}%` }}
          />
        </span>
      ) : null}
      <span
        className={cn(
          "text-xs text-muted-foreground",
          rechecking && "opacity-60"
        )}
        data-testid="plan-wizard-verdict-detail"
      >
        {[verdictLabel, ...details].join(" · ")}
      </span>
    </button>
  )
}
