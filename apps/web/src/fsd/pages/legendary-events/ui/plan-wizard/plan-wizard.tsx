import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import type {
  AscensionStep,
  LegendaryEventLaneId,
  LegendaryEventRun,
} from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"
import { useTourPageSteps } from "@/shared/tour"
import { UnsavedChangesGuard } from "@/shared/ui"

import { PLAN_WIZARD_STEPS, type PlanWizardStep } from "./plan-draft"
import {
  planWrites,
  writeCounts,
  type PlanDestination,
  type PlanWrites,
} from "./plan-create"
import { PlanSummary } from "./plan-summary"
import type { DraftTeam } from "./plan-teams"
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

interface CreateSnapshot {
  writes: PlanWrites
  destination: PlanDestination
  runs: readonly LegendaryEventRun[]
  teamName: (team: DraftTeam) => string
}

export type PlanWizardEntry = "overview" | "suggestions" | "link"

/** New teams are named by their display name, within the API's 60-character limit. */
const TEAM_NAME_MAX_LENGTH = 60

const stepIndex = (value: string | null) =>
  PLAN_WIZARD_STEPS.indexOf(value as PlanWizardStep)

/**
 * The 1-click plan wizard (spec: five steps with a preview before anything is written): Target,
 * Upgrades, Teams, Runs and tokens, Review and create. A stepper on the left from 768px, a
 * "Step N of 5" header with chips for visited steps and a progress bar below it, the plan summary,
 * and a sticky Back / Next footer. The step is the `?step=` parameter, so the browser's Back and
 * Forward move between steps (spec: wizard step is kept in the URL). Leaving with changes asks
 * first; nothing is written until Create.
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
  const isMobile = useIsMobile()
  const [params, setParams] = useSearchParams()
  // The furthest step visited; a step after it (a reload or a deep link) shows it instead. The
  // draft is not saved, so a reload starts at Target.
  const [visited, setVisited] = useState(0)
  const index = Math.min(Math.max(stepIndex(params.get("step")), 0), visited)
  const step = PLAN_WIZARD_STEPS[index]!
  useEffect(() => {
    if (params.get("step") === step) return
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set("step", step)
        return next
      },
      { replace: true }
    )
  }, [params, step, setParams])
  const setStep = (next: PlanWizardStep) => {
    setVisited((current) => Math.max(current, stepIndex(next)))
    setParams((current) => {
      const updated = new URLSearchParams(current)
      updated.set("step", next)
      return updated
    })
  }
  // The Teams step's lane (tabs on mobile), also set by the leftover-tokens link.
  const [lane, setLane] = useState<LegendaryEventLaneId>("alpha")
  const openTeams = (laneId: LegendaryEventLaneId) => {
    setLane(laneId)
    setStep("teams")
  }
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

  // The first Create freezes what is sent: creating goals and teams refreshes the reads the draft is
  // built from, so Retry failed resends exactly the first attempt's items.
  const [snapshot, setSnapshot] = useState<CreateSnapshot | null>(null)
  const runCreate = async () => {
    let frozen = snapshot
    if (!frozen) {
      if (!destination.value) return
      const names = new Map(
        writes.lanes.flatMap((lane) =>
          lane.create.map((team) => [
            team.key,
            draft.teamName(team.key).slice(0, TEAM_NAME_MAX_LENGTH),
          ])
        )
      )
      frozen = {
        writes,
        destination: destination.value,
        runs: draft.runs,
        teamName: (team) => names.get(team.key) ?? "",
      }
      setSnapshot(frozen)
    }
    const { writes: sent, ...rest } = frozen
    const result = await create.run({
      ...rest,
      writes: sent,
      targetEventId: source.event.id,
      onlyFailed: create.items.length > 0,
    })
    const { goals, teams } = writeCounts(sent)
    captureEvent({
      type: "legendary_event_plan_created",
      eventId: source.event.id,
      goals,
      teams,
      ok: result.ok,
    })
    if (!result.ok) return
    const projectId = result.projectId
    toast.success(
      t("planWizard.toast.created", {
        goals: t("planWizard.counts.goals", { count: goals }),
        teams: t("planWizard.counts.teams", { count: teams }),
      }),
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
  // Once Create has run, the draft is frozen: only Retry failed is left.
  const locked = create.running || snapshot !== null
  // Create waits until the chosen target's recommendations are final, or it would file a partial list.
  const exploring = !draft.targetSettled
  const last = index === PLAN_WIZARD_STEPS.length - 1
  const shownWrites = snapshot?.writes ?? writes
  const counts = writeCounts(shownWrites)
  let createLabel: string
  if (counts.goals > 0 || counts.teams > 0) {
    const parts = [
      counts.goals > 0
        ? t("planWizard.counts.goals", { count: counts.goals })
        : null,
      counts.teams > 0
        ? t("planWizard.counts.teams", { count: counts.teams })
        : null,
    ].filter((part) => part !== null)
    createLabel =
      parts.length === 2
        ? t("planWizard.createBoth", { goals: parts[0], teams: parts[1] })
        : t("planWizard.createOne", { what: parts[0] })
  } else if (counts.runs) {
    createLabel = t("planWizard.saveRunInputs")
  } else {
    createLabel = t("planWizard.create")
  }
  const summary = (
    <PlanSummary
      draft={draft}
      locked={locked}
      mobile={isMobile}
      onChangeTarget={() => setStep("target")}
      writes={shownWrites}
    />
  )

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
        <ol
          aria-label={t("planWizard.stepsLabel")}
          className="flex flex-wrap gap-1.5"
          data-testid="plan-wizard-chips"
        >
          {PLAN_WIZARD_STEPS.map((entry, position) => (
            <li key={entry}>
              <button
                aria-current={entry === step ? "step" : undefined}
                className={cn(
                  "min-h-8 rounded-full border px-2.5 text-xs",
                  entry === step
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                  position > visited && "opacity-50"
                )}
                data-testid={`plan-wizard-chip-${entry}`}
                disabled={locked || position > visited}
                onClick={() => setStep(entry)}
                type="button"
              >
                {t(`planWizard.steps.${entry}`)}
              </button>
            </li>
          ))}
        </ol>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{
              width: `${((index + 1) / PLAN_WIZARD_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
      {isMobile ? summary : null}
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
                    position > visited && "opacity-60"
                  )}
                  data-testid={`plan-wizard-step-${entry}`}
                  disabled={locked || position > visited}
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
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          {isMobile ? null : summary}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {step === "target" ? (
              <TargetStep draft={draft} source={source} />
            ) : null}
            {step === "upgrades" ? <UpgradesStep draft={draft} /> : null}
            {step === "teams" ? (
              <TeamsStep draft={draft} lane={lane} onLaneChange={setLane} />
            ) : null}
            {step === "runs" ? (
              <RunsStep draft={draft} onOpenTeams={openTeams} source={source} />
            ) : null}
            {step === "review" ? (
              <ReviewStep
                create={create}
                destination={destination}
                draft={draft}
                exploring={exploring}
                locked={locked}
                writes={shownWrites}
              />
            ) : null}
          </div>
        </div>
      </div>
      <div
        className={cn(
          "sticky z-10 -mx-4 flex items-center justify-between gap-3 border-t bg-background px-4 py-3 sm:-mx-6 sm:px-6",
          // Above the bottom navigation on mobile.
          isMobile ? "bottom-(--mobile-nav-height)" : "bottom-0"
        )}
        data-testid="plan-wizard-footer"
      >
        <Button
          disabled={index === 0 || locked}
          onClick={() => setStep(PLAN_WIZARD_STEPS[index - 1]!)}
          variant="outline"
        >
          {t("planWizard.back")}
        </Button>
        {last ? (
          <Button
            data-testid="plan-wizard-create"
            disabled={
              create.running ||
              created ||
              // Retry failed resends the frozen snapshot: it needs neither the search nor a
              // destination.
              (!snapshot && (exploring || !destination.value))
            }
            onClick={() => void runCreate()}
          >
            {create.running
              ? t("planWizard.creating")
              : failed
                ? t("planWizard.retryFailed")
                : createLabel}
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
        description={
          failed
            ? t("planWizard.leave.failedDescription")
            : t("planWizard.leave.description")
        }
        leaveLabel={t("planWizard.leave.leave")}
        stayLabel={t("planWizard.leave.stay")}
        title={t("planWizard.leave.title")}
        when={
          !created &&
          ((draft.dirty && create.items.length === 0) ||
            (failed && !create.running))
        }
      />
    </div>
  )
}
