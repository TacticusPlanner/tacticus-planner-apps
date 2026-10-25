import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { writeCounts, type PlanWrites } from "./plan-create"
import { planSummaryFacts } from "./plan-summary.model"
import type { PlanDraft } from "./use-plan-draft"

/**
 * The plan summary on every step (spec: plan summary on every step): the target and its verdict,
 * the ceiling against the points needed (or the spare points), the goals to create and the team
 * changes. A Too ambitious target shows its warning here with Change target. On desktop it is a
 * panel (a rail from 1024px, a strip above the content below that); on mobile a one-line sticky
 * strip that expands on tap.
 */
export function PlanSummary({
  draft,
  writes,
  locked,
  onChangeTarget,
  mobile,
}: {
  draft: PlanDraft
  writes: PlanWrites
  /** Create has run: the draft is frozen. */
  locked: boolean
  onChangeTarget: () => void
  mobile: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const [expanded, setExpanded] = useState(false)
  const facts = planSummaryFacts(draft)
  const counts = writeCounts(writes)
  const removed = writes.lanes.reduce(
    (sum, lane) => sum + lane.remove.length,
    0
  )
  const created = writes.lanes.reduce(
    (sum, lane) => sum + lane.create.length,
    0
  )

  if (!facts) return null
  const stepName = t(`outlook.steps.${facts.step}`)
  const headline = t("planWizard.summary.target", {
    step: stepName,
    verdict: facts.checking
      ? t("planWizard.target.verdicts.checking")
      : t(`planWizard.target.verdicts.${facts.verdict}`),
  })
  let ceiling: string
  if (facts.kind === "unreachable") {
    ceiling = t("planWizard.target.unreachable")
  } else if (facts.ceiling >= facts.points) {
    ceiling = t("planWizard.summary.spare", {
      points: number.format(facts.ceiling - facts.points),
    })
  } else {
    ceiling = t("planWizard.summary.ceiling", {
      ceiling: number.format(facts.ceiling),
      points: number.format(facts.points),
    })
  }
  const best = draft.options.best
    ? t("planWizard.target.bestStep", {
        step: t(`outlook.steps.${draft.options.best}`),
      })
    : t("planWizard.target.noStep")

  const details = (
    <>
      <p data-testid="plan-wizard-summary-goals">
        {t("planWizard.summary.goals", { count: counts.goals })}
      </p>
      <p data-testid="plan-wizard-summary-teams">
        {t("planWizard.summary.teams", {
          created: number.format(created),
          removed: number.format(removed),
        })}
      </p>
      {facts.tooAmbitious ? (
        <div
          className="flex flex-col items-start gap-1 rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1.5"
          data-testid="plan-wizard-summary-warning"
        >
          <span>{t("planWizard.banner", { step: stepName, best })}</span>
          <Button
            className="h-auto px-0"
            disabled={locked}
            onClick={onChangeTarget}
            variant="link"
          >
            {t("planWizard.bannerLink")}
          </Button>
        </div>
      ) : null}
    </>
  )
  // Announced once, when the default target moves to the highest step within reach.
  const announcement = (
    <p
      aria-live="polite"
      className={cn(!draft.movedToBest && "sr-only")}
      data-testid="plan-wizard-summary-moved"
    >
      {draft.movedToBest ? best : ""}
    </p>
  )

  if (mobile) {
    return (
      <aside
        aria-label={t("planWizard.summary.label")}
        className="sticky top-0 z-10 -mx-4 flex flex-col gap-1 border-b bg-background px-4 py-2 text-sm"
        data-testid="plan-wizard-summary"
      >
        <button
          aria-expanded={expanded}
          className="flex min-h-11 w-full items-center gap-2 text-left"
          onClick={() => setExpanded((open) => !open)}
          type="button"
        >
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium">{headline}</span>
            {" · "}
            <span data-testid="plan-wizard-summary-ceiling">{ceiling}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </button>
        {expanded || facts.tooAmbitious ? (
          <div className="flex flex-col gap-1 pb-1 text-muted-foreground">
            {details}
          </div>
        ) : null}
        {announcement}
      </aside>
    )
  }
  return (
    <aside
      aria-label={t("planWizard.summary.label")}
      className="flex flex-col gap-1.5 rounded-xl border p-3 text-sm lg:sticky lg:top-4 lg:order-last lg:w-64 lg:shrink-0"
      data-testid="plan-wizard-summary"
    >
      <h2 className="text-xs font-semibold text-muted-foreground uppercase">
        {t("planWizard.summary.label")}
      </h2>
      <p className="font-medium">{headline}</p>
      <p data-testid="plan-wizard-summary-ceiling">{ceiling}</p>
      <div className="flex flex-col gap-1.5 text-muted-foreground">
        {details}
      </div>
      {announcement}
    </aside>
  )
}
