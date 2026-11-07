import { useTranslation } from "react-i18next"

import { formatSnapshotDate } from "@/entities/roster-snapshot"

import {
  reasonKeyForRosterSnapshotOutcome,
  type RosterSnapshotBucketKey,
  type RosterSnapshotBuckets,
} from "../model/roster-snapshot-outcome-buckets"

const BUCKET_ORDER: readonly RosterSnapshotBucketKey[] = [
  "imported",
  "needsNoImport",
  "notImported",
  "failed",
]

/**
 * The roster snapshots part's per-snapshot report (design D5): the goal buckets with their counts,
 * each expandable to the V1 name and date, the reason, and the units left out when any were. Each
 * starts collapsed except Failed.
 */
export function RosterSnapshotImportResult({
  buckets,
}: {
  buckets: RosterSnapshotBuckets
}) {
  const { t, i18n } = useTranslation()

  return (
    <section className="grid gap-2" data-testid="v1-import-roster-snapshots">
      <p className="font-medium">{t("goals.v1Import.rosterSnapshots.title")}</p>
      {BUCKET_ORDER.filter((bucket) => buckets[bucket].length > 0).map(
        (bucket) => (
          <details
            className="grid gap-1"
            data-testid={`v1-import-snapshot-bucket-${bucket}`}
            key={bucket}
            open={bucket === "failed"}
          >
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              {`${t(`goals.v1Import.report.${bucket}`)} (${buckets[bucket].length})`}
            </summary>
            <ul className="mt-1 grid gap-1">
              {buckets[bucket].map((outcome, index) => (
                <li
                  className="rounded-lg border bg-background p-2 text-xs"
                  data-testid="v1-import-snapshot"
                  key={`${outcome.takenAt}-${index}`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">
                      {outcome.name ||
                        t("goals.v1Import.rosterSnapshots.unnamed")}
                    </span>
                    <span className="text-muted-foreground">
                      {formatSnapshotDate(outcome.takenAt, i18n.language)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-muted-foreground">
                    {t(reasonKeyForRosterSnapshotOutcome(outcome))}
                  </p>
                  {outcome.droppedUnits > 0 ? (
                    <p className="mt-0.5 text-muted-foreground">
                      {t("goals.v1Import.rosterSnapshots.droppedUnits", {
                        count: outcome.droppedUnits,
                      })}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>
        )
      )}
    </section>
  )
}
