import { useTranslation } from "react-i18next"
import {
  legendaryEventResourceIcon,
  type LegendaryEventResource,
} from "@workspace/game-catalog"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type { RewardProjection } from "@/entities/legendary-event"
import { IconLine } from "@/shared/ui"

import type { RewardOutlookViewModel } from "./legendary-event-page.view-model"

/**
 * The Run status card's Reward outlook (design D6): the next ascension step, the chests and
 * currency it takes and the points milestone that covers the rest, each in one line, then a "How
 * this is worked out" disclosure. Hidden when the synced data or the event's ladder is unavailable
 * (the card's own failure note stands).
 */
export function RewardOutlook({
  outlook,
}: {
  outlook: RewardOutlookViewModel
}) {
  const { t } = useTranslation("legendaryEvents")
  if (outlook.kind === "unavailable") return null
  return (
    <section
      aria-labelledby="legendary-event-outlook-title"
      className="flex flex-col gap-2 border-t pt-3"
      data-testid="reward-outlook"
    >
      <h3 className="text-sm font-semibold" id="legendary-event-outlook-title">
        {t("outlook.title")}
      </h3>
      {outlook.kind === "loading" ? (
        <Skeleton
          className="h-12 w-full rounded-lg"
          data-testid="reward-outlook-loading"
        />
      ) : (
        <OutlookBody projection={outlook.projection} />
      )}
    </section>
  )
}

function OutlookBody({ projection }: { projection: RewardProjection }) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const decimal = new Intl.NumberFormat(i18n.language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const { goal, chests, currency, points, base } = projection

  const lines: {
    testId: string
    text: string
    icon?: LegendaryEventResource
  }[] = []
  if (goal.step === "fullyAscended") {
    lines.push({
      testId: "reward-outlook-complete",
      text: t("outlook.fullyAscended"),
    })
  } else {
    lines.push({
      testId: "reward-outlook-next",
      icon: "shards",
      text: t("outlook.next", {
        step: t(`outlook.steps.${goal.step}`),
        shards: number.format(base.shards),
        threshold: number.format(goal.threshold),
      }),
    })
  }
  if (chests?.beyondChestLadder) {
    lines.push({
      testId: "reward-outlook-beyond-chests",
      text: t("outlook.beyondChests", {
        required: number.format(chests.required),
        ladder: number.format(chests.ladderSize),
      }),
    })
  } else if (chests && currency) {
    lines.push({
      testId: "reward-outlook-chests",
      icon: "chests",
      text: t("outlook.chests", {
        count: chests.toGo,
        chests: number.format(chests.toGo),
        currency: number.format(currency.required),
      }),
    })
  }
  if (points?.state === "affordableNow") {
    lines.push({
      testId: "reward-outlook-affordable",
      text: t("outlook.affordableNow"),
    })
  } else if (points?.state === "milestone") {
    lines.push({
      testId: "reward-outlook-points",
      icon: "points",
      text: t("outlook.points", {
        points: number.format(points.pointsToGo),
        target: number.format(points.cumulativePoints),
        battles: decimal.format(points.averageBattlesPerLane),
      }),
    })
  } else if (points?.state === "beyondPointsLadder") {
    lines.push({
      testId: "reward-outlook-beyond-points",
      text: t("outlook.beyondPoints", {
        currency: number.format(points.currencyShort),
      }),
    })
  }

  return (
    <>
      {projection.synced ? null : (
        <p
          className="text-xs text-muted-foreground"
          data-testid="reward-outlook-no-entry"
        >
          {t("outlook.noEntry")}
        </p>
      )}
      <ul className="flex flex-col gap-1 text-sm">
        {lines.map((line) => (
          <IconLine
            icon={line.icon && legendaryEventResourceIcon(line.icon)}
            key={line.testId}
            testId={line.testId}
          >
            {line.text}
          </IconLine>
        ))}
      </ul>
      <details
        className="rounded-xl border p-3 text-sm"
        data-testid="reward-outlook-explain"
      >
        <summary className="cursor-pointer font-medium">
          {t("outlook.explain.title")}
        </summary>
        <ExplanationLines projection={projection} />
      </details>
    </>
  )
}

function ExplanationLines({ projection }: { projection: RewardProjection }) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const { base } = projection
  const lines: string[] = [
    projection.synced
      ? t("outlook.explain.base", {
          currency: number.format(base.currency),
          chests: number.format(base.chestsClaimed),
          shards: number.format(base.shards),
          points: number.format(base.points),
        })
      : t("outlook.explain.noBase"),
  ]
  for (const run of projection.futureRuns) {
    if (run.missionCurrency > 0) {
      lines.push(
        t("outlook.explain.missions", {
          currency: number.format(run.missionCurrency),
          run: run.run,
        })
      )
    }
    if (run.bundleCurrency > 0) {
      lines.push(
        t("outlook.explain.bundle", {
          currency: number.format(run.bundleCurrency),
          run: run.run,
        })
      )
    }
    if (run.closeShards > 0) {
      lines.push(
        t("outlook.explain.closeShards", {
          shards: number.format(run.closeShards),
          run: run.run,
        })
      )
    }
  }
  if (
    projection.futureRuns.every(
      (run) =>
        run.missionCurrency === 0 &&
        run.bundleCurrency === 0 &&
        run.closeShards === 0
    )
  ) {
    lines.push(t("outlook.explain.noFutureInputs"))
  }
  lines.push(
    projection.bonusPerPayout > 0
      ? t("outlook.explain.bonus", {
          currency: number.format(projection.bonusPerPayout),
        })
      : t("outlook.explain.noBonus"),
    t("outlook.explain.startedRuns")
  )
  return (
    <ul
      className="mt-2 flex list-disc flex-col gap-1 pl-5 text-muted-foreground"
      data-testid="reward-outlook-explain-lines"
    >
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}
