import type { ReactNode } from "react"
import { Link, useParams, useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { ASCENSION_STEPS, type AscensionStep } from "@/entities/legendary-event"

import { PlanWizard, type PlanWizardEntry } from "./plan-wizard"
import { usePlanSource } from "./use-plan-source"

const ENTRIES: readonly string[] = ["overview", "suggestions"]
const entryOf = (value: string | null): PlanWizardEntry =>
  value && ENTRIES.includes(value) ? (value as PlanWizardEntry) : "link"

const isAscensionStep = (value: string | null): value is AscensionStep =>
  (ASCENSION_STEPS as readonly (string | null)[]).includes(value)

/** `/legendary-events/:eventId/plan` (spec: 1-click plan wizard page). `?target=` preselects a
 *  step; `?from=` names the entry point for analytics. Keyed by the event id so a new event starts a fresh draft. */
export function PlanWizardPage() {
  const { eventId = "" } = useParams()
  return <PlanWizardPageContent eventId={eventId} key={eventId} />
}

function PlanWizardPageContent({ eventId }: { eventId: string }) {
  const { t } = useTranslation("legendaryEvents")
  const [params] = useSearchParams()
  const source = usePlanSource(eventId)
  const target = params.get("target")
  const backToEvent = (
    <Button asChild variant="outline">
      <Link to={`/legendary-events/${eventId}`}>
        {t("planWizard.states.backToEvent")}
      </Link>
    </Button>
  )

  switch (source.status) {
    case "loading":
      return (
        <div className="flex flex-col gap-3" data-testid="plan-wizard-loading">
          <span className="sr-only">{t("planWizard.states.loading")}</span>
          <Skeleton className="h-12 w-1/2 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )
    case "error":
      return (
        <div
          className="flex flex-col items-start gap-3"
          data-testid="plan-wizard-error"
        >
          <p className="text-sm text-destructive">
            {t("planWizard.states.error")}
          </p>
          <Button onClick={source.retry} variant="outline">
            {t("planWizard.states.retry")}
          </Button>
        </div>
      )
    case "missing":
      return (
        <Message
          testId="plan-wizard-missing"
          text={t("planWizard.states.missing")}
        >
          <Button asChild variant="outline">
            <Link to="/legendary-events">
              {t("planWizard.states.backToEvents")}
            </Link>
          </Button>
        </Message>
      )
    case "signedOut":
      return (
        <Message
          testId="plan-wizard-signed-out"
          text={t("planWizard.states.signedOut")}
        >
          {backToEvent}
        </Message>
      )
    case "finished":
      return (
        <Message
          testId="plan-wizard-finished"
          text={t("planWizard.states.finished")}
        >
          {backToEvent}
        </Message>
      )
    case "noEstimates":
      return (
        <Message
          testId="plan-wizard-no-estimates"
          text={t("planWizard.states.noEstimates")}
        >
          {backToEvent}
        </Message>
      )
    case "ready":
      return (
        <PlanWizard
          initialTarget={isAscensionStep(target) ? target : null}
          openedFrom={entryOf(params.get("from"))}
          source={source}
        />
      )
  }
}

function Message({
  text,
  testId,
  children,
}: {
  text: string
  testId: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-3" data-testid={testId}>
      <p className="text-sm text-muted-foreground">{text}</p>
      {children}
    </div>
  )
}
