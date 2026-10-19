import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { AscensionStep } from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"
import { useTourPageSteps } from "@/shared/tour"
import { UnsavedChangesGuard } from "@/shared/ui"

import { PLAN_WIZARD_STEPS, type PlanWizardStep } from "./plan-draft"
import { planWrites } from "./plan-create"
import { usePlanWizardTutorial } from "./plan-wizard.tutorial"
import { ReviewStep } from "./review-step"
import { RunsStep } from "./runs-step"
import { TargetStep } from "./target-step"
import { TeamsStep } from "./teams-step"
import { UpgradesStep } from "./upgrades-step"
import { usePlanCreate } from "./use-plan-create"
import { usePlanDestination } from "./use-plan-destination"
import { usePlanDraft } from "./use-plan-draft"
import type { PlanSource } from "./use-plan-source"

export type PlanWizardEntry = "overview" | "suggestions" | "link"

/** New teams are named by their display name, within the API's 60-character limit. */
const TEAM_NAME_MAX_LENGTH = 60

/**
 * The 1-click plan wizard (spec: five steps with a preview before anything is written): Target,
 * Upgrades, Teams, Runs and tokens, Review and create. A stepper on the left from 768px, a
 * "Step N of 5" header with a progress bar below it, and a sticky Back / Next footer. Leaving with
 * changes asks first; nothing is written until Create.
 */
export function PlanWizard({
  source,
  initialTarget,
  openedFrom = "link",
}: {
  source: Extract<PlanSource, { status: "ready" }>
  initialTarget: AscensionStep | null
  /** The entry point, for analytics. */
  openedFrom?: PlanWizardEntry
}) {
  const { t } = useTranslation("legendaryEvents")
  const navigate = useNavigate()
  const draft = usePlanDraft(source, initialTarget)
  const create = usePlanCreate(source.event.id)
  const destination = usePlanDestination(source, draft.target)
  const [step, setStep] = useState<PlanWizardStep>("target")
  const [created, setCreated] = useState(false)
  useTourPageSteps(usePlanWizardTutorial())
  const { captureEvent } = useAnalyticsActions()
  const reported = useRef(false)
  useEffect(() => {
    if (reported.current) return
    reported.current = true
    captureEvent({
      type: "legendary_event_plan_wizard_opened",
      eventId: source.event.id,
      source: openedFrom,
    })
  }, [captureEvent, openedFrom, source.event.id])
  const index = PLAN_WIZARD_STEPS.indexOf(step)
  const name = source.inputs.nameOf(source.event.id)
  const eventPath = `/legendary-events/${source.event.id}`

  const writes = useMemo(
    () =>
      planWrites({
        plan: source.inputs.plan,
        teams: draft.evaluation.teams,
        chains: draft.chains,
        runs: draft.runs,
        economy: draft.economy,
      }),
    [
      source.inputs.plan,
      draft.evaluation,
      draft.chains,
      draft.runs,
      draft.economy,
    ]
  )

  // Navigate once the guard has re-rendered without the draft's changes.
  useEffect(() => {
    if (created) void navigate(eventPath)
  }, [created, navigate, eventPath])

  const runCreate = async (onlyFailed: boolean) => {
    if (!destination.value) return
    const result = await create.run({
      writes,
      destination: destination.value,
      targetEventId: source.event.id,
      runs: draft.runs,
      teamName: (team) =>
        draft.teamName(team.key).slice(0, TEAM_NAME_MAX_LENGTH),
      onlyFailed,
    })
    const teams = writes.lanes.reduce(
      (sum, lane) => sum + lane.create.length,
      0
    )
    captureEvent({
      type: "legendary_event_plan_created",
      eventId: source.event.id,
      goals: writes.goals.length,
      teams,
      ok: result.ok,
    })
    if (!result.ok) return
    const projectId = result.projectId
    toast.success(
      t("planWizard.toast.created", { goals: writes.goals.length, teams }),
      projectId
        ? {
            action: {
              label: t("planWizard.toast.openProject"),
              onClick: () => void navigate(`/plan/goals?project=${projectId}`),
            },
          }
        : undefined
    )
    setCreated(true)
  }

  const failed = create.items.some((item) => item.status === "failed")
  const last = index === PLAN_WIZARD_STEPS.length - 1
  const tooAmbitious =
    draft.options.options.find((option) => option.target.step === draft.target)
      ?.verdict.kind === "tooAmbitious"

  return (
    <div className="flex min-w-0 flex-col gap-4" data-testid="plan-wizard">
      <div className="flex flex-col gap-1">
        <Link
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          to={eventPath}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t("planWizard.states.backToEvent")}
        </Link>
        <h1 className="text-xl font-semibold">
          {t("planWizard.title", { name })}
        </h1>
      </div>
      <div
        className="flex flex-col gap-2 md:hidden"
        data-testid="plan-wizard-progress"
      >
        <p className="text-sm text-muted-foreground">
          {t("planWizard.progress", {
            step: index + 1,
            count: PLAN_WIZARD_STEPS.length,
            name: t(`planWizard.steps.${step}`),
          })}
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{
              width: `${((index + 1) / PLAN_WIZARD_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
      <div className="flex min-w-0 gap-6">
        <nav
          aria-label={t("planWizard.stepsLabel")}
          className="hidden w-48 shrink-0 md:block"
          data-testid="plan-wizard-stepper"
        >
          <ol className="flex flex-col gap-1">
            {PLAN_WIZARD_STEPS.map((entry, position) => (
              <li key={entry}>
                <button
                  aria-current={entry === step ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                    entry === step
                      ? "bg-muted font-medium"
                      : "text-muted-foreground hover:bg-muted/60",
                    position > index && "opacity-60"
                  )}
                  data-testid={`plan-wizard-step-${entry}`}
                  disabled={create.running || position > index}
                  onClick={() => setStep(entry)}
                  type="button"
                >
                  <span className="flex size-5 items-center justify-center rounded-full border text-xs">
                    {position + 1}
                  </span>
                  {t(`planWizard.steps.${entry}`)}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {tooAmbitious && step !== "target" ? (
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
              data-testid="plan-wizard-banner"
              role="status"
            >
              <span>
                {t("planWizard.banner", {
                  step: t(`outlook.steps.${draft.target}`),
                  best: draft.options.best
                    ? t("planWizard.target.bestStep", {
                        step: t(`outlook.steps.${draft.options.best}`),
                      })
                    : t("planWizard.target.noStep"),
                })}
              </span>
              <Button
                className="h-auto px-0"
                onClick={() => setStep("target")}
                variant="link"
              >
                {t("planWizard.bannerLink")}
              </Button>
            </div>
          ) : null}
          {step === "target" ? (
            <TargetStep draft={draft} source={source} />
          ) : null}
          {step === "upgrades" ? <UpgradesStep draft={draft} /> : null}
          {step === "teams" ? <TeamsStep draft={draft} /> : null}
          {step === "runs" ? <RunsStep draft={draft} source={source} /> : null}
          {step === "review" ? (
            <ReviewStep
              create={create}
              destination={destination}
              draft={draft}
              writes={writes}
            />
          ) : null}
        </div>
      </div>
      <div
        className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t bg-background px-4 py-3"
        data-testid="plan-wizard-footer"
      >
        <Button
          disabled={index === 0 || create.running}
          onClick={() => setStep(PLAN_WIZARD_STEPS[index - 1]!)}
          variant="outline"
        >
          {t("planWizard.back")}
        </Button>
        {last ? (
          <Button
            data-testid="plan-wizard-create"
            disabled={create.running || !destination.value || created}
            onClick={() => void runCreate(failed)}
          >
            {create.running
              ? t("planWizard.creating")
              : failed
                ? t("planWizard.retryFailed")
                : t("planWizard.create")}
          </Button>
        ) : (
          <Button
            data-testid="plan-wizard-next"
            disabled={draft.target === null}
            onClick={() => setStep(PLAN_WIZARD_STEPS[index + 1]!)}
          >
            {t("planWizard.next")}
          </Button>
        )}
      </div>
      <UnsavedChangesGuard
        description={t("planWizard.leave.description")}
        leaveLabel={t("planWizard.leave.leave")}
        stayLabel={t("planWizard.leave.stay")}
        title={t("planWizard.leave.title")}
        when={draft.dirty && !created && create.items.length === 0}
      />
    </div>
  )
}
