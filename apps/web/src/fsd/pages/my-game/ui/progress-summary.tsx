import { MedalStats, type TrackMedalStats } from "@/features/daily-raids"

/** A headline progress block: percent, battles done, tracks cleared and medal stats. */
export function ProgressSummary({
  label,
  done,
  total,
  percent,
  cleared,
  medals,
  testId,
}: {
  label: string
  done: number
  total: number
  percent: number
  cleared: number
  medals: TrackMedalStats | undefined
  testId?: string
}) {
  return (
    <div data-testid={testId}>
      <p className="text-xs font-semibold text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-3xl font-bold tabular-nums">{percent}%</p>
      <p className="text-xs text-muted-foreground">
        {done}/{total} · {cleared} cleared
      </p>
      {medals ? (
        <p className="mt-1 text-muted-foreground">
          <MedalStats stats={medals} />
        </p>
      ) : null}
    </div>
  )
}
