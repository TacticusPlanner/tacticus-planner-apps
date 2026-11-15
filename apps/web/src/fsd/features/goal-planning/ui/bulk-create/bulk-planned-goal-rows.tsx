import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight } from "lucide-react"
import { rankIcon } from "@workspace/game-catalog"
import {
  progressionRarity,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import { progressionLabel } from "@/entities/goal"
import { CompactStars, EntityIcon, RarityIcon } from "@/shared/ui"

import type { BulkPlannedGoal } from "../../model/bulk-create/bulk-goal-plan"
import { plannedAbilityTracks } from "../../model/bulk-create/planned-ability-tracks"

type TFunction = ReturnType<typeof useTranslation>["t"]

/**
 * One unit's planned goals, one row each: the goal type, then start → end as icons (a rarity icon with
 * the short star count, rank icons, ability levels). Abilities get a row per track it raises. Every row
 * carries its full text for assistive technology; the icons are decorative.
 */
export function BulkPlannedGoalRows({
  goals,
}: {
  goals: readonly BulkPlannedGoal[]
}) {
  const { t } = useTranslation()
  return (
    <ul className="flex flex-col gap-1 text-muted-foreground">
      {goals.flatMap((goal) => goalRows(t, goal))}
    </ul>
  )
}

function goalRows(t: TFunction, goal: BulkPlannedGoal): ReactNode[] {
  const type = t(`goals.create.goalTypes.${goal.goalType}`)
  switch (goal.goalType) {
    case "Unlock":
      return [<PlannedRow key="Unlock" label={type} type={type} />]
    case "Ascension":
      return [
        <PlannedRow
          end={<ProgressionIcons progression={goal.end} />}
          key={`Ascension-${goal.end}`}
          label={plannedGoalLabel(t, goal)}
          start={<ProgressionIcons progression={goal.start} />}
          tag={goal.added ? t("goals.bulkCreate.goal.needed") : undefined}
          type={type}
        />,
      ]
    case "Rank":
      return [
        <PlannedRow
          end={<RankIcon rank={goal.end} />}
          key="Rank"
          label={plannedGoalLabel(t, goal)}
          start={<RankIcon rank={goal.start} />}
          type={type}
        />,
      ]
    case "Ability":
      return plannedAbilityTracks(goal).map(({ track, start, end }) => {
        const trackType = t(`goals.bulkCreate.goal.${track}`)
        return (
          <PlannedRow
            end={<Level value={end} />}
            key={`Ability-${track}`}
            label={t("goals.bulkCreate.goal.range", {
              type: trackType,
              start,
              end,
            })}
            start={<Level value={start} />}
            type={trackType}
          />
        )
      })
  }
}

function PlannedRow({
  type,
  label,
  start,
  end,
  tag,
}: {
  type: string
  label: string
  start?: ReactNode
  end?: ReactNode
  tag?: string
}) {
  return (
    <li className="flex items-center gap-2" data-testid="bulk-goal-planned">
      <span className="sr-only">{label}</span>
      <span aria-hidden className="flex flex-wrap items-center gap-2">
        <span className="min-w-16">{type}</span>
        {start && end ? (
          <>
            {start}
            <ArrowRight className="size-3.5 shrink-0" />
            {end}
          </>
        ) : null}
        {tag ? <span className="text-xs">({tag})</span> : null}
      </span>
    </li>
  )
}

function ProgressionIcons({ progression }: { progression: Progression }) {
  return (
    <span className="flex items-center gap-1">
      <RarityIcon className="size-5" rarity={progressionRarity(progression)} />
      <CompactStars progression={progression} />
    </span>
  )
}

function RankIcon({ rank }: { rank: Rank }) {
  return <EntityIcon alt="" className="size-6" src={rankIcon(rank)} />
}

function Level({ value }: { value: number }) {
  return <span className="font-semibold tabular-nums">{value}</span>
}

/** A planned goal as one line of text: the screen-reader name of its row. */
function plannedGoalLabel(t: TFunction, goal: BulkPlannedGoal): string {
  const type = t(`goals.create.goalTypes.${goal.goalType}`)
  switch (goal.goalType) {
    case "Unlock":
      return type
    case "Ascension":
      return t(
        goal.added
          ? "goals.bulkCreate.goal.ascensionAdded"
          : "goals.bulkCreate.goal.range",
        {
          type,
          start: progressionLabel(t, goal.start),
          end: progressionLabel(t, goal.end),
        }
      )
    case "Rank":
      return t("goals.bulkCreate.goal.range", {
        type,
        start: t(`ranks.${goal.start}`, {
          ns: "progression",
          defaultValue: goal.start,
        }),
        end: t(`ranks.${goal.end}`, {
          ns: "progression",
          defaultValue: goal.end,
        }),
      })
    case "Ability":
      return t("goals.bulkCreate.goal.range", {
        type,
        start: `${goal.activeStart}/${goal.passiveStart}`,
        end: `${goal.activeEnd}/${goal.passiveEnd}`,
      })
  }
}
