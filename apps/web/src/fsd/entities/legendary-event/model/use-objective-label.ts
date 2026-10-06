import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { laneAllowedRule } from "../lib/lane-label"
import {
  describeUnitFilter,
  type ObjectiveIcon,
  type ObjectiveLabelSpec,
} from "../lib/objective-label"
import type {
  LegendaryEventLane,
  LegendaryEventObjective,
  LegendaryEventUnitFilter,
} from "./types"

export interface ObjectiveLabel {
  label: string
  icon: ObjectiveIcon | undefined
}

const NAMESPACES = [
  "legendaryEvents",
  "traits",
  "damageTypes",
  "factions",
  "common",
] as const

/** Resolves a game-data entry (`traits:Flying`, `common:alliances.Xenos`, …) or `undefined` when
 *  the namespace lacks it, so the caller can fall back to the catalog's own name. */
function useEntryLabel() {
  const { i18n } = useTranslation(NAMESPACES)
  return useCallback(
    (key: string): string | undefined =>
      i18n.exists(key) ? String(i18n.t(key as never)) : undefined,
    [i18n]
  )
}

/**
 * A resolver from an objective to its localized label and icon (design D6): labels come from the
 * filter `{ kind, target, exclude }` through the `traits`, `damageTypes`, `factions` and
 * `common:alliances` entries and the `legendaryEvents:objective.*` templates; the catalog's English
 * `name` is only the fallback.
 */
export function useObjectiveLabel(): (
  objective: Pick<LegendaryEventObjective, "name" | "filter">
) => ObjectiveLabel {
  const { t } = useTranslation(NAMESPACES)
  const entryLabel = useEntryLabel()

  return useCallback(
    (objective) => {
      const { label, icon } = describeUnitFilter(objective.filter)
      const format = (spec: ObjectiveLabelSpec): string => {
        switch (spec.type) {
          case "entry": {
            const base = entryLabel(spec.key)
            if (base === undefined) return objective.name
            return spec.negate
              ? t("legendaryEvents:objective.not", { label: base })
              : base
          }
          case "hits": {
            return t(`legendaryEvents:objective.${spec.template}`, {
              count: spec.count,
            })
          }
          case "attackType": {
            return t(`legendaryEvents:objective.${spec.template}`)
          }
          case "name": {
            return objective.name
          }
        }
      }
      return { label: format(label), icon }
    },
    [entryLabel, t]
  )
}

/** A resolver from a lane to its localized allowed-units rule ("No Xenos", "No Chaos or Orks"),
 *  `undefined` when the lane excludes nothing. */
export function useLaneAllowedRule(): (
  lane: Pick<LegendaryEventLane, "allowedUnitsFilter">
) => string | undefined {
  const { t, i18n } = useTranslation(NAMESPACES)
  const entryLabel = useEntryLabel()

  return useCallback(
    (lane) => {
      const labelOf = (filter: LegendaryEventUnitFilter) => {
        const { label } = describeUnitFilter(filter)
        return (
          (label.type === "entry" && entryLabel(label.key)) || filter.target
        )
      }
      return laneAllowedRule(
        lane.allowedUnitsFilter,
        labelOf,
        (label) => t("legendaryEvents:objective.not", { label }),
        i18n.language
      )
    },
    [entryLabel, i18n.language, t]
  )
}
