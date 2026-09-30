import { useEffect } from "react"

import type { FactionGroup, UnitId } from "@workspace/game-domain"

import type { CreateGoalPrefill } from ".//create-goal-launcher-context"

/**
 * Preselects the first Character of the unit combobox's list (list order, Mows skipped) whenever the
 * dialog is open with no unit chosen — on open, once the catalog has loaded, and again after a
 * "create another" reset (which clears the unit). Never overrides a chosen unit, and a launch that
 * carries its own unit (`prefill.entityId`) always wins.
 */
export function useDefaultUnitPreselect({
  open,
  prefill,
  entityId,
  unitGroups,
  isCharacter,
  handleEntityChange,
}: {
  open: boolean
  prefill?: CreateGoalPrefill
  entityId: UnitId | undefined
  unitGroups: FactionGroup[]
  isCharacter: (id: UnitId) => boolean
  handleEntityChange: (entityId: UnitId) => void
}) {
  const prefillsUnit = !!prefill && "entityId" in prefill
  const firstCharacterId = unitGroups
    .flatMap((group) => group.members)
    .find((member) => isCharacter(member.id))?.id

  useEffect(() => {
    if (!open || entityId || prefillsUnit || !firstCharacterId) return
    handleEntityChange(firstCharacterId)
    // handleEntityChange is recreated each render; the guards above make this run once per need.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entityId, prefillsUnit, firstCharacterId])
}
