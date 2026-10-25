import {
  useDeferredValue,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import type { AscensionStep } from "@/entities/legendary-event"
import { RunInputsForm } from "@/features/legendary-event-plan"
import { useAnalyticsActions } from "@/shared/analytics"
import { safeStorage } from "@/shared/lib"

import { RosterPotentialMap } from "../legendary-event/roster-potential-map"
import { planPotentials } from "./plan-potential"
import { TargetCard } from "./target-card"
import { runAssumptions } from "./target-step.model"
import type { PlanDraft } from "./use-plan-draft"
import type { PlanSource } from "./use-plan-source"

const ASSUMPTIONS_OPEN_KEY = "legendaryEvents.planWizard.assumptions.open"

/** Step 1 (spec: target step leads with the choice): the deadline, then one card per step after
 *  the unit's progression with its points, verdict and ceiling bar, the highest step within
 *  reach, the run inputs in a collapsed Assumptions panel (missions and paid options change the
 *  points, so the verdicts follow them), and every lane's roster potential under Why this
 *  verdict?. */
export function TargetStep({
  draft,
  source,
}: {
  draft: PlanDraft
  source: Extract<PlanSource, { status: "ready" }>
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" })
  const { captureEvent } = useAnalyticsActions()
  const { runDates } = source
  const name = source.inputs.nameOf(source.event.id)
  const shards = source.inputs.progress?.currentShards
  const exploring =
    draft.recommendations.status === "estimating" ||
    draft.recommendations.status === "running"
  // Run-input edits not yet planned, or a search in progress: verdicts are being rechecked.
  const busy = exploring || draft.settling
  const lastVerdicts = useMemo(
    () =>
      new Map(
        draft.lastSettledOptions.options.map((option) => [
          option.target.step,
          option.verdict,
        ])
      ),
    [draft.lastSettledOptions]
  )
  const isMobile = useIsMobile()
  const { inputs, runs } = draft
  // The potential maps follow the ticks at deferred priority.
  const evaluation = useDeferredValue(draft.evaluation)
  const potentials = useMemo(
    () => planPotentials(inputs, evaluation, runs),
    [inputs, evaluation, runs]
  )
  const cards = useRef(new Map<AscensionStep, HTMLButtonElement>())
  const options = draft.options.options
  const syncedCeiling = draft.syncedCeiling ?? 0
  const upgradedCeiling =
    "upgradedCeiling" in draft.recommendations
      ? draft.recommendations.upgradedCeiling
      : syncedCeiling
  const choose = (step: AscensionStep) => {
    const option = options.find((entry) => entry.target.step === step)
    if (!option) return
    draft.chooseTarget(step)
    captureEvent({
      type: "legendary_event_plan_target_chosen",
      eventId: source.event.id,
      step,
      verdict: option.verdict.kind,
    })
  }
  // Arrow keys move the choice within the group, as native radios do.
  const onCardKey = (event: KeyboardEvent<HTMLButtonElement>, at: number) => {
    const delta =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? -1
          : 0
    if (delta === 0) return
    event.preventDefault()
    const next = options[(at + delta + options.length) % options.length]
    if (!next) return
    choose(next.target.step)
    cards.current.get(next.target.step)?.focus()
  }
  const assumptions = runAssumptions(source.event, draft.economy, runs)
  const assumptionsSummary = [
    ...assumptions.map((entry) =>
      [
        t("planWizard.assumptions.run", {
          run: entry.run,
          missions: number.format(entry.missions),
          of: number.format(entry.of),
        }),
        ...(entry.bundle ? [t("planWizard.assumptions.bundle")] : []),
      ].join(" · ")
    ),
    ...(draft.economy.showPaidOptions
      ? [t("planWizard.assumptions.paidOn")]
      : []),
  ].join(" · ")

  let deadline: string
  if (runDates.deadlineMs === null) {
    deadline = t("planWizard.target.deadlineUnknown")
  } else {
    deadline = t(
      runDates.deadlineEstimated
        ? "planWizard.target.deadlineEstimated"
        : "planWizard.target.deadline",
      { date: date.format(runDates.deadlineMs) }
    )
  }

  return (
    <section className="flex flex-col gap-4" data-testid="plan-wizard-target">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">
          {t("planWizard.target.heading", { name })}
        </h2>
        <p
          className="text-sm text-muted-foreground"
          data-testid="plan-wizard-deadline"
        >
          {deadline}
        </p>
        {shards !== undefined ? (
          <p className="text-sm text-muted-foreground">
            {t("planWizard.target.shards", {
              name,
              shards: number.format(shards),
            })}
          </p>
        ) : null}
      </div>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("planWizard.target.noTargets")}
        </p>
      ) : (
        <div
          aria-label={t("planWizard.steps.target")}
          className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
          data-testid="plan-wizard-target-cards"
          role="radiogroup"
        >
          {options.map(({ target, verdict: current }, at) => {
            const checked = target.step === draft.target
            // Upgrades only raise the ceiling, so a step reachable now stays settled while the
            // search runs; anything else shows its last settled verdict, dimmed, until rechecked.
            const rechecking =
              busy && (draft.settling || current.kind !== "reachableNow")
            return (
              <TargetCard
                buttonRef={(element) => {
                  if (element) cards.current.set(target.step, element)
                  else cards.current.delete(target.step)
                }}
                checked={checked}
                currentKind={current.kind}
                focusable={checked || (draft.target === null && at === 0)}
                key={target.step}
                onKeyDown={(event) => onCardKey(event, at)}
                onSelect={() => choose(target.step)}
                rechecking={rechecking}
                syncedCeiling={syncedCeiling}
                target={target}
                upgradedCeiling={upgradedCeiling}
                verdict={
                  rechecking
                    ? (lastVerdicts.get(target.step) ?? current)
                    : current
                }
              />
            )
          })}
        </div>
      )}
      <p className="text-sm" data-testid="plan-wizard-best-step">
        {busy
          ? t("planWizard.target.estimating")
          : draft.options.best
            ? t("planWizard.target.bestStep", {
                step: t(`outlook.steps.${draft.options.best}`),
              })
            : t("planWizard.target.noStep")}
      </p>
      <Disclosure
        storageKey={ASSUMPTIONS_OPEN_KEY}
        summary={assumptionsSummary}
        testId="plan-wizard-run-inputs"
        title={t("planWizard.assumptions.title")}
      >
        <p className="text-sm text-muted-foreground">
          {t("planWizard.runs.description")}
        </p>
        <div className="flex flex-col [&>div]:px-0">
          <RunInputsForm
            event={source.event}
            inputs={{
              loading: false,
              failed: false,
              showPaidOptions: draft.economy.showPaidOptions,
              values: draft.runValues,
              change: draft.changeRun,
              setShowPaidOptions: draft.setShowPaidOptions,
            }}
            runs={source.inputs.resolution}
            touch={isMobile}
          />
        </div>
      </Disclosure>
      <Disclosure
        testId="plan-wizard-potential"
        title={t("planWizard.target.why")}
      >
        <h3 className="font-semibold">{t("laneOverview.potential.title")}</h3>
        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          {inputs.lanes.map(({ laneId, lane }) => (
            <div className="flex min-w-0 flex-col gap-1" key={laneId}>
              <h4 className="text-sm font-medium">{t(`lanes.${laneId}`)}</h4>
              <RosterPotentialMap
                isMobile={isMobile}
                lane={lane}
                view={potentials[laneId]}
              />
            </div>
          ))}
        </div>
      </Disclosure>
    </section>
  )
}

/** A collapsible panel; with `storageKey` its open state is remembered per device. */
function Disclosure({
  title,
  summary,
  storageKey,
  testId,
  children,
}: {
  title: string
  summary?: string
  storageKey?: string
  testId: string
  children: ReactNode
}) {
  const regionId = useId()
  const [open, setOpenState] = useState(
    () => storageKey !== undefined && safeStorage.get(storageKey) === "true"
  )
  const toggle = () => {
    setOpenState(!open)
    if (storageKey) safeStorage.set(storageKey, String(!open))
  }
  return (
    <div className="flex flex-col rounded-xl border" data-testid={testId}>
      <button
        aria-controls={regionId}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-3 p-3 text-left"
        data-testid={`${testId}-toggle`}
        onClick={toggle}
        type="button"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{title}</span>
          {summary ? (
            <span
              className="text-sm text-muted-foreground"
              data-testid={`${testId}-summary`}
            >
              {summary}
            </span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <div className="flex flex-col gap-3 px-3 pb-3" id={regionId}>
          {children}
        </div>
      ) : null}
    </div>
  )
}
