import { damageTypeIcon, factionIcon, traitIcon } from "@workspace/game-catalog"

import defeatAllSrc from "../assets/defeat-all.png"
import scoreSrc from "../assets/score.png"
import statHitSrc from "../assets/stat-hit.png"
import statMeleeSrc from "../assets/stat-melee.png"
import statRangedSrc from "../assets/stat-ranged.png"
import type { LegendaryEventUnitFilter } from "../model/types"

/** The V1 icon set shipped with the entity (design D6). */
export const defeatAllIcon = defeatAllSrc
export const scoreIcon = scoreSrc

/** An objective's icon: a game asset plus an optional badge (red X for a negated filter, "≥" / "≤"
 *  for a hits bound). */
export interface ObjectiveIcon {
  src: string
  badge?: "not" | "min" | "max"
}

/**
 * How to label a unit filter, before translation: a game-data entry (`traits:Flying`), a
 * `legendaryEvents:objective.*` template, or the catalog's own English `name` as the last resort.
 * `negate` wraps the resolved label in the "No {{label}}" template.
 */
export type ObjectiveLabelSpec =
  | { type: "entry"; key: string; negate: boolean }
  | { type: "hits"; template: "minHits" | "maxHits"; count: number }
  | { type: "attackType"; template: "ranged" | "melee" }
  | { type: "name" }

export interface ObjectiveDescription {
  label: ObjectiveLabelSpec
  icon: ObjectiveIcon | undefined
}

function badged(src: string, exclude: boolean): ObjectiveIcon {
  return exclude ? { src, badge: "not" } : { src }
}

/**
 * Describes a catalog unit filter `{ kind, target, exclude }` as a label recipe and an icon,
 * independently of the catalog's English `name` (which drifts from the game's wording).
 */
export function describeUnitFilter(
  filter: LegendaryEventUnitFilter
): ObjectiveDescription {
  const { kind, target, exclude } = filter
  switch (kind) {
    case "Trait": {
      return {
        label: { type: "entry", key: `traits:${target}`, negate: exclude },
        icon: badged(traitIcon(target), exclude),
      }
    }
    case "DamageType": {
      return {
        label: { type: "entry", key: `damageTypes:${target}`, negate: exclude },
        icon: badged(damageTypeIcon(target), exclude),
      }
    }
    case "Faction": {
      const src = factionIcon(target)
      return {
        label: { type: "entry", key: `factions:${target}`, negate: exclude },
        icon: src ? badged(src, exclude) : undefined,
      }
    }
    case "Alliance": {
      return {
        label: {
          type: "entry",
          key: `common:alliances.${target}`,
          negate: exclude,
        },
        icon: undefined,
      }
    }
    case "MinHits":
    case "MaxHits": {
      const count = Number(target)
      const icon: ObjectiveIcon = {
        src: statHitSrc,
        badge: kind === "MinHits" ? "min" : "max",
      }
      return Number.isFinite(count)
        ? {
            label: {
              type: "hits",
              template: kind === "MinHits" ? "minHits" : "maxHits",
              count,
            },
            icon,
          }
        : { label: { type: "name" }, icon }
    }
    case "AttackType": {
      // The catalog encodes "Melee" as "not Ranged".
      const melee = target === "Ranged" ? exclude : !exclude
      return {
        label: { type: "attackType", template: melee ? "melee" : "ranged" },
        icon: { src: melee ? statMeleeSrc : statRangedSrc },
      }
    }
    default: {
      return { label: { type: "name" }, icon: undefined }
    }
  }
}
