import { Suspense } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"

import type { V1TeamOutcome } from "@/entities/account"
import { TEAM_LIMITS, useTeamRuleText } from "@/entities/team"

import {
  classifyTeamIssue,
  reasonKeyForTeamOutcome,
} from "../model/team-outcome-buckets"
import type { TeamBucketKey, TeamBuckets } from "../model/team-outcome-buckets"

const BUCKET_ORDER: readonly TeamBucketKey[] = [
  "imported",
  "needsNoImport",
  "notImported",
  "failed",
]

function TeamOutcomeRow({ outcome }: { outcome: V1TeamOutcome }) {
  const { t } = useTranslation()
  const ruleText = useTeamRuleText()
  const issues = outcome.issues.map(classifyTeamIssue)
  const breaksRules = issues.some((issue) => issue.kind === "rule")
  return (
    <li
      className="rounded-lg border bg-background p-2 text-xs"
      data-testid="v1-import-team"
    >
      <span className="font-medium">
        {outcome.name || t("goals.v1Import.teams.unnamed")}
      </span>
      <p className="mt-0.5 text-muted-foreground">
        {t(reasonKeyForTeamOutcome(outcome), { count: TEAM_LIMITS.maxTeams })}
      </p>
      {issues.length > 0 ? (
        <ul className="mt-1 grid gap-0.5" data-testid="v1-import-team-issues">
          {issues.map((issue, index) => (
            <li key={index}>
              {issue.kind === "rule"
                ? ruleText(issue.code).reason
                : t(issue.key, { value: issue.value ?? "" })}
            </li>
          ))}
        </ul>
      ) : null}
      {breaksRules ? (
        <p className="mt-1">
          {t("goals.v1Import.teams.fixOnTeamsPage")}{" "}
          <Link className="underline underline-offset-4" to="/my-game/teams">
            {t("goals.v1Import.teams.openTeams")}
          </Link>
        </p>
      ) : null}
    </li>
  )
}

/**
 * The teams part's per-team report (design D8): the goal buckets with their counts, each
 * expandable to the V1 team name, the reason, and its issues as translated lines with the value
 * concerned, never raw codes. A team that breaks a team rule says it can be fixed on the Teams
 * page and links there. Each starts collapsed except Failed. The rule reasons come from the `teams`
 * namespace, which nothing on the import pages preloads, so the buckets wait for it in their own
 * `Suspense` instead of suspending the whole page.
 */
export function TeamImportResult({ buckets }: { buckets: TeamBuckets }) {
  const { t } = useTranslation()
  return (
    <section className="grid gap-2" data-testid="v1-import-teams-result">
      <p className="font-medium">{t("goals.v1Import.teams.title")}</p>
      <Suspense fallback={null}>
        <TeamBucketList buckets={buckets} />
      </Suspense>
    </section>
  )
}

function TeamBucketList({ buckets }: { buckets: TeamBuckets }) {
  const { t } = useTranslation()
  return (
    <>
      {BUCKET_ORDER.filter((bucket) => buckets[bucket].length > 0).map(
        (bucket) => (
          <details
            className="grid gap-1"
            data-testid={`v1-import-team-bucket-${bucket}`}
            key={bucket}
            open={bucket === "failed"}
          >
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              {`${t(`goals.v1Import.report.${bucket}`)} (${buckets[bucket].length})`}
            </summary>
            <ul className="mt-1 grid gap-1">
              {buckets[bucket].map((outcome, index) => (
                <TeamOutcomeRow
                  key={`${outcome.name}-${index}`}
                  outcome={outcome}
                />
              ))}
            </ul>
          </details>
        )
      )}
    </>
  )
}
