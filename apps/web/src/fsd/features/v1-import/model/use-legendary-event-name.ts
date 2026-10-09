import { useTranslation } from "react-i18next"

import type { V1LegendaryEventOutcome } from "@/entities/account"
import { useUnitName } from "@/shared/unit-name"

/** An event outcome's name: the event unit's localized name when the catalog knows the event,
 *  otherwise its V1 number. */
export function useLegendaryEventName() {
  const { t } = useTranslation()
  const unitName = useUnitName()
  return (outcome: Pick<V1LegendaryEventOutcome, "eventId" | "v1EventId">) =>
    outcome.eventId
      ? unitName("Character", outcome.eventId)
      : t("goals.v1Import.legendaryEvents.v1Event", { id: outcome.v1EventId })
}
