import { damageTypeIcon, factionIcon, traitIcon } from "@workspace/game-catalog"

import type { LegendaryEventUnitFilter } from "../model/types"

/** A glyph drawn with an app icon rather than a game asset. */
export type ObjectiveGlyph = "hits" | "ranged" | "melee"

export type ObjectiveIcon =
  { type: "image"; src: string } | { type: "glyph"; glyph: ObjectiveGlyph }

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
        icon: { type: "image", src: traitIcon(target) },
      }
    }
    case "DamageType": {
      return {
        label: { type: "entry", key: `damageTypes:${target}`, negate: exclude },
        icon: { type: "image", src: damageTypeIcon(target) },
      }
    }
    case "Faction": {
      const src = factionIcon(target)
      return {
        label: { type: "entry", key: `factions:${target}`, negate: exclude },
        icon: src ? { type: "image", src } : undefined,
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
      return Number.isFinite(count)
        ? {
            label: {
              type: "hits",
              template: kind === "MinHits" ? "minHits" : "maxHits",
              count,
            },
            icon: { type: "glyph", glyph: "hits" },
          }
        : { label: { type: "name" }, icon: { type: "glyph", glyph: "hits" } }
    }
    case "AttackType": {
      // The catalog encodes "Melee" as "not Ranged".
      const melee = target === "Ranged" ? exclude : !exclude
      const template = melee ? "melee" : "ranged"
      return {
        label: { type: "attackType", template },
        icon: { type: "glyph", glyph: template },
      }
    }
    default: {
      return { label: { type: "name" }, icon: undefined }
    }
  }
}
