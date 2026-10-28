import { useTranslation } from "react-i18next"

import { useUnitName } from "@/shared/unit-name"

import type { HomeEventRow } from "../../model/select-home-events"

/** A Home event's display name: the featured hero for a Legendary Event, else the HSE's name. */
export function useHomeEventName(): (row: HomeEventRow) => string {
  const { t } = useTranslation("events")
  const unitName = useUnitName()
  return (row) =>
    row.type === "legendaryEvent"
      ? unitName("Character", row.unitId)
      : t(`definitions.${row.definitionId}`, {
          defaultValue: row.definitionId,
        })
}
