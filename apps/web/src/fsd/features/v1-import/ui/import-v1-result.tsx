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
import { Button } from "@workspace/ui/components/button"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

import type { ImportV1ProfileResult, V1GoalOutcome } from "@/entities/account"
import { GoalTypeBadge, type GoalKind } from "@/entities/goal"

import {
  buildDiagnosticText,
  effectiveGoalsStatus,
  groupOutcomes,
  importedCounts,
  isAutomaticallyAdded,
} from "../model/outcome-buckets"
import { useEntityDisplayName } from "../model/use-entity-display-name"

// Kept in step with `V1ImportPanel`'s own `parts` tuple in v1-import-panel.tsx (split into this
// file purely for the repository's max-lines rule, same as goal-spec-builder.ts's split out of
// use-create-goal-form.ts).
const parts = [
  ["personalTacticusApiKey", "goals.v1Import.parts.personalKey"],
  ["tacticusUserId", "goals.v1Import.parts.userId"],
  ["guildApiToken", "goals.v1Import.parts.guildKey"],
  ["goals", "goals.v1Import.parts.goals"],
  ["onslaughtProgress", "goals.v1Import.parts.onslaughtProgress"],
  ["campaignEventProgress", "goals.v1Import.parts.campaignEventProgress"],
] as const

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
  const getEntityName = useEntityDisplayName()

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
  const autoAdded = buckets.imported.filter(isAutomaticallyAdded)
  const hasDiagnostics =
    buckets.notImported.length > 0 || buckets.failed.length > 0

  const goalTypeLabel = (goalType: string | null) =>
    goalType ? t(`goals.create.goalTypes.${goalType as GoalKind}`) : null

  // "not_selected" (ImportPartResult.NotSelected — API contract) hides a part the user didn't ask
  // for, so a cleared part can't be mistaken for one that was attempted and skipped.
  const rows = parts
    .filter(([key]) => result[key].code !== "not_selected")
    .filter(([key]) => !(key === "goals" && syncRequired))
    .map(([key, label]) => ({
      key,
      label,
      part:
        key === "goals"
          ? { ...result.goals, status: goalsStatus }
          : result[key],
    }))

  const copyDetails = () => {
    const text = buildDiagnosticText({
      notImported: buckets.notImported,
      failed: buckets.failed,
      heading: (bucket) => t(`goals.v1Import.report.${bucket}`),
      unitName: getEntityName,
      goalTypeLabel,
      noUnitLabel: t("goals.v1Import.report.noUnit"),
    })
    void navigator.clipboard.writeText(text)
  }

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

      {!syncRequired && result.outcomes.length > 0 ? (
        <ScrollArea className="max-h-72">
          <div className="grid gap-3 pr-2">
            {buckets.imported.length > 0 ? (
              <div data-testid="v1-import-bucket-imported">
                <p className="font-medium">
                  {t("goals.v1Import.report.imported")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("goals.v1Import.report.importedCounts", {
                    goals: importedGoalCount,
                    units: importedUnitCount,
                  })}
                </p>
                {autoAdded.length > 0 ? (
                  <ul className="mt-1 grid gap-1">
                    {autoAdded.map((outcome, index) => (
                      <OutcomeRow
                        auto
                        getEntityName={getEntityName}
                        key={index}
                        outcome={outcome}
                        t={t}
                      />
                    ))}
                  </ul>
                ) : null}
              </div>
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
                          getEntityName={getEntityName}
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
                        getEntityName={getEntityName}
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
        </ScrollArea>
      ) : null}

      {hasDiagnostics ? (
        <Button
          className="justify-self-start"
          data-testid="v1-import-copy"
          onClick={copyDetails}
          size="sm"
          type="button"
          variant="outline"
        >
          {t("goals.v1Import.report.copy")}
        </Button>
      ) : null}
    </div>
  )
}

function OutcomeRow({
  outcome,
  getEntityName,
  t,
  auto,
}: {
  outcome: V1GoalOutcome
  getEntityName: (entityType: string | null, entityId: string | null) => string
  t: TFunction
  auto?: boolean
}) {
  const unit = outcome.entityId
    ? getEntityName(outcome.entityType, outcome.entityId)
    : t("goals.v1Import.report.noUnit")

  return (
    <li className="rounded-lg border bg-background p-2 text-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        {auto ? (
          <Badge variant="secondary">
            {t("goals.v1Import.report.autoAdded")}
          </Badge>
        ) : null}
        <span className="font-medium">{unit}</span>
        {outcome.goalType ? (
          // The API's GoalType/GoalEntityType wire values (e.g. "Rank", "Character") are exactly
          // this badge's expected union — trusted here the same way use-create-goal-form.ts trusts
          // its own entity-type/player-record correlation.
          <GoalTypeBadge
            entityType={outcome.entityType ?? undefined}
            type={outcome.goalType as GoalKind}
          />
        ) : null}
      </div>
      <p className="mt-0.5 text-muted-foreground">{outcome.message}</p>
    </li>
  )
}
