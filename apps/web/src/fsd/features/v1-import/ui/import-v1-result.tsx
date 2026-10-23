import { useMemo } from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"

import type { ImportV1ProfileResult, V1GoalOutcome } from "@/entities/account"
import { GoalTypeBadge } from "@/entities/goal"
import { useUnitName } from "@/shared/unit-name"

import {
  effectiveGoalsStatus,
  groupOutcomes,
  importedCounts,
  isAutomaticallyAdded,
  outcomeSubject,
  materialSteps,
  reasonKeyForCode,
} from "../model/outcome-buckets"
import {
  groupLegendaryEventOutcomes,
  reasonKeyForLegendaryEventCode,
} from "../model/legendary-event-outcome-buckets"
import { V1_IMPORT_PARTS } from "../model/parts"
import { useUpgradeName } from "../model/use-upgrade-name"
import { LegendaryEventImportResult } from "./legendary-event-import-result"
import { MaterialSteps } from "./material-steps"

// i18next's `t` only accepts keys it can statically verify exist in the locale resources, so a
// status-derived key is built through this small literal-keyed lookup rather than a template
// literal over a plain `string` (mirrors goal-type-badge.tsx's own
// `t(\`goals.create.goalTypes.${type}\`)`, which works only because `type` is the closed `GoalKind`
// union, not a generic string).
const STATUS_KEYS = {
  Imported: "goals.v1Import.status.imported",
  Skipped: "goals.v1Import.status.skipped",
  Failed: "goals.v1Import.status.failed",
} as const

export function ImportResult({ result }: { result: ImportV1ProfileResult }) {
  const { t } = useTranslation()
  const getEntityName = useUnitName()
  const upgradeName = useUpgradeName()
  const subjectFor = (outcome: V1GoalOutcome) =>
    outcomeSubject(outcome, {
      unitName: getEntityName,
      upgradeName,
      noUnitLabel: t("goals.v1Import.report.noUnit"),
    })

  const buckets = useMemo(
    () => groupOutcomes(result.outcomes),
    [result.outcomes]
  )
  const goalsStatus = effectiveGoalsStatus(result.goals.status, result.outcomes)
  // The refusal is the only outcome in the list when it happens (v1-goal-import API contract) — shown
  // as its own blocking explanation instead of a normal Goals row + outcome report.
  const syncRequired = result.goals.code === "player_data_required"
  const { goals: importedGoalCount, units: importedUnitCount } = importedCounts(
    buckets.imported
  )
  const manualSteps = useMemo(
    () => materialSteps(result.outcomes),
    [result.outcomes]
  )
  // Absent from a response of an API that predates the part.
  const legendaryEventBuckets = useMemo(
    () => groupLegendaryEventOutcomes(result.legendaryEventOutcomes ?? []),
    [result.legendaryEventOutcomes]
  )
  // "not_selected" (ImportPartResult.NotSelected — API contract) hides a part the user didn't ask
  // for, so a cleared part can't be mistaken for one that was attempted and skipped.
  // The Legendary Event part's own code is translated; the other parts keep the server's message.
  const rows = V1_IMPORT_PARTS.filter(({ key }) => result[key])
    .filter(({ key }) => result[key].code !== "not_selected")
    .filter(({ key }) => !(key === "goals" && syncRequired))
    .map(({ key, label }) => {
      const part =
        key === "goals" ? { ...result.goals, status: goalsStatus } : result[key]
      return {
        key,
        label,
        part:
          key === "legendaryEventPlans" && part.code
            ? { ...part, message: t(reasonKeyForLegendaryEventCode(part.code)) }
            : part,
      }
    })

  return (
    <div
      className="grid gap-3 rounded-xl bg-muted p-3 text-sm"
      data-testid="v1-import-result"
    >
      <div className="grid gap-2">
        {rows.map(({ key, label, part }) => (
          <div className="grid gap-0.5" key={key}>
            <div className="flex justify-between gap-3">
              <span>{t(label)}</span>
              <span className="font-medium">{t(STATUS_KEYS[part.status])}</span>
            </div>
            {part.message ? (
              <p className="text-xs text-muted-foreground">{part.message}</p>
            ) : null}
          </div>
        ))}
      </div>

      {syncRequired ? (
        <Alert data-testid="v1-import-sync-required" variant="destructive">
          <AlertTitle>
            {t("goals.v1Import.report.syncRequiredTitle")}
          </AlertTitle>
          <AlertDescription>
            {t("goals.v1Import.report.syncRequired")}
          </AlertDescription>
        </Alert>
      ) : null}

      {!syncRequired && manualSteps.length > 0 ? (
        <MaterialSteps steps={manualSteps} />
      ) : null}

      {!syncRequired && result.outcomes.length > 0 ? (
        <div className="grid gap-3">
          {buckets.imported.length > 0 ? (
            // Collapsed under its count: the list is long and needs no action (only Not imported and
            // Failed open by default).
            <details className="group" data-testid="v1-import-bucket-imported">
              <summary className="flex cursor-pointer items-baseline gap-2">
                <span className="font-medium">
                  {t("goals.v1Import.report.imported")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("goals.v1Import.report.importedCounts", {
                    goals: importedGoalCount,
                    units: importedUnitCount,
                  })}
                </span>
              </summary>
              <ul className="mt-1 grid gap-1">
                {buckets.imported.map((outcome, index) => (
                  <OutcomeRow
                    auto={isAutomaticallyAdded(outcome)}
                    subject={subjectFor(outcome)}
                    key={index}
                    outcome={outcome}
                    t={t}
                  />
                ))}
              </ul>
            </details>
          ) : null}

          {buckets.needsNoImport.length > 0 ? (
            <Accordion type="single" collapsible>
              <AccordionItem value="needsNoImport">
                <AccordionTrigger data-testid="v1-import-bucket-needsNoImport">
                  {t("goals.v1Import.report.needsNoImport")} (
                  {buckets.needsNoImport.length})
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="grid gap-1">
                    {buckets.needsNoImport.map((outcome, index) => (
                      <OutcomeRow
                        subject={subjectFor(outcome)}
                        key={index}
                        outcome={outcome}
                        t={t}
                      />
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null}

          {(["notImported", "failed"] as const).map((bucket) =>
            buckets[bucket].length > 0 ? (
              <div data-testid={`v1-import-bucket-${bucket}`} key={bucket}>
                <p className="font-medium">
                  {t(`goals.v1Import.report.${bucket}`)} (
                  {buckets[bucket].length})
                </p>
                <ul className="grid gap-1">
                  {buckets[bucket].map((outcome, index) => (
                    <OutcomeRow
                      subject={subjectFor(outcome)}
                      key={index}
                      outcome={outcome}
                      t={t}
                    />
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
      ) : null}

      {(result.legendaryEventOutcomes?.length ?? 0) > 0 ? (
        <LegendaryEventImportResult buckets={legendaryEventBuckets} />
      ) : null}
    </div>
  )
}

function OutcomeRow({
  outcome,
  subject,
  t,
  auto,
}: {
  outcome: V1GoalOutcome
  /** The unit, or the material of a unit-less material goal (outcomeSubject). */
  subject: string
  t: TFunction
  auto?: boolean
}) {
  return (
    <li className="rounded-lg border bg-background p-2 text-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        {auto ? (
          <Badge variant="secondary">
            {t("goals.v1Import.report.autoAdded")}
          </Badge>
        ) : null}
        <span className="font-medium">{subject}</span>
        {outcome.goalType ? (
          // The API's GoalType/GoalEntityType wire values (e.g. "Rank", "Character") are exactly
          // this badge's expected union — trusted here the same way use-create-goal-form.ts trusts
          // its own entity-type/player-record correlation.
          <GoalTypeBadge
            entityType={outcome.entityType ?? undefined}
            type={outcome.goalType}
          />
        ) : null}
      </div>
      <p className="mt-0.5 text-muted-foreground">
        {t(reasonKeyForCode(outcome.code))}
      </p>
    </li>
  )
}
