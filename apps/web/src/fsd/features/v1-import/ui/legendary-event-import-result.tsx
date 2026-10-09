import { useTranslation } from "react-i18next"

import {
  issueKeyForLegendaryEventCode,
  reasonKeyForLegendaryEventOutcome,
  type LegendaryEventBuckets,
} from "../model/legendary-event-outcome-buckets"
import type { OutcomeBucketKey } from "../model/outcome-buckets"
import { useLegendaryEventName } from "../model/use-legendary-event-name"

const BUCKET_ORDER: readonly OutcomeBucketKey[] = [
  "imported",
  "needsNoImport",
  "notImported",
  "failed",
]

/**
 * The Legendary Event teams part's per-event report (v1-profile-import spec): one row per V1
 * event in the goal buckets, each with its translated reason (imported ones with the team count,
 * or a no-teams reason when none was kept) and its issues beneath it as one translated line each,
 * naming the team and the V1 value. Empty buckets are omitted.
 */
export function LegendaryEventImportResult({
  buckets,
}: {
  buckets: LegendaryEventBuckets
}) {
  const { t } = useTranslation()
  const eventName = useLegendaryEventName()

  return (
    <section className="grid gap-2" data-testid="v1-import-legendary-events">
      <p className="font-medium">{t("goals.v1Import.legendaryEvents.title")}</p>
      {BUCKET_ORDER.filter((bucket) => buckets[bucket].length > 0).map(
        (bucket) => (
          <div
            className="grid gap-1"
            data-testid={`v1-import-le-bucket-${bucket}`}
            key={bucket}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {t(`goals.v1Import.report.${bucket}`)} ({buckets[bucket].length})
            </p>
            <ul className="grid gap-1">
              {buckets[bucket].map((outcome) => (
                <li
                  className="rounded-lg border bg-background p-2 text-xs"
                  data-testid="v1-import-le-event"
                  key={`${outcome.v1EventId}-${outcome.eventId ?? ""}`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">{eventName(outcome)}</span>
                    {bucket === "imported" && outcome.teamsImported > 0 ? (
                      <span className="text-muted-foreground">
                        {t("goals.v1Import.legendaryEvents.teams", {
                          count: outcome.teamsImported,
                        })}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-muted-foreground">
                    {t(reasonKeyForLegendaryEventOutcome(outcome))}
                  </p>
                  {outcome.issues.length > 0 ? (
                    <ul className="mt-1 grid gap-0.5 border-l pl-2">
                      {outcome.issues.map((issue, index) => (
                        <li data-testid="v1-import-le-issue" key={index}>
                          {t(issueKeyForLegendaryEventCode(issue.code))}
                          {issue.teamName ? (
                            <span className="ml-1 font-medium">
                              {issue.teamName}
                            </span>
                          ) : null}
                          {issue.value ? (
                            <code className="ml-1 rounded bg-muted px-1">
                              {issue.value}
                            </code>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </section>
  )
}
