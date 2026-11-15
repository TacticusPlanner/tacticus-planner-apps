import { useTranslation } from "react-i18next"
import { isProgression, rankAt } from "@workspace/game-domain"

import type { CombinedGoalSpec } from "@/entities/goal"
import { ProgressionBadge, RankBadge } from "@/shared/ui"

/**
 * A goal's start → target in one line, from a creation spec or a stored goal's config: "Gold II →
 * Diamond II", "Legendary ★★★ → ★★★★", "Active 20 → 21 · Passive 18 → 19", "2 materials". Nothing for
 * Unlock, which has no target.
 */
export function GoalRangeSummary({
  spec,
  entityType,
}: {
  spec: Pick<CombinedGoalSpec, "goalType" | "config">
  entityType: "Character" | "Mow"
}) {
  const { t } = useTranslation()
  const { config } = spec
  const arrow = <span aria-hidden>→</span>

  switch (spec.goalType) {
    case "Rank":
      return config.rank ? (
        <span className="inline-flex flex-wrap items-center gap-1">
          <RankBadge rank={rankAt(config.rank.start)} />
          {arrow}
          <RankBadge rank={rankAt(config.rank.end)} />
        </span>
      ) : null
    case "Ascension": {
      const progression = config.progression
      return progression &&
        isProgression(progression.start) &&
        isProgression(progression.end) ? (
        <span className="inline-flex flex-wrap items-center gap-1">
          <ProgressionBadge value={progression.start} />
          {arrow}
          <ProgressionBadge value={progression.end} />
        </span>
      ) : null
    }
    case "Ability": {
      const ability = config.ability
      if (!ability) return null
      const isMow = entityType === "Mow"
      const tracks = [
        {
          track: t(
            isMow
              ? "goals.create.ability.tracks.primary"
              : "goals.create.ability.tracks.active"
          ),
          start: ability.activeStart,
          end: ability.activeEnd,
        },
        {
          track: t(
            isMow
              ? "goals.create.ability.tracks.secondary"
              : "goals.create.ability.tracks.passive"
          ),
          start: ability.passiveStart,
          end: ability.passiveEnd,
        },
      ].filter((entry) => entry.end > entry.start)
      return (
        <span>
          {tracks
            .map((entry) => t("goals.create.ability.trackRange", entry))
            .join(" · ")}
        </span>
      )
    }
    case "Upgrade":
      return config.upgrade ? (
        <span>
          {t("goals.target.upgradeMaterials", {
            count: config.upgrade.targets.length,
          })}
        </span>
      ) : null
    default:
      return null
  }
}
