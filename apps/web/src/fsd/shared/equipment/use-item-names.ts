import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { isItemSlotType } from "./item-slots"

/** A slot type's name as the game shows it ("Crit Item"), from the generated `gameUi` namespace;
 *  an unknown type falls back to the raw type. */
export function useItemSlotName(): (type: string) => string {
  const { t } = useTranslation("gameUi")
  return useCallback(
    (type: string) => (isItemSlotType(type) ? t(`items.slots.${type}`) : type),
    [t]
  )
}

/** An item's name in the game's own words (`equipmentItems`), falling back to its catalog name. */
export function useItemName(): (item: { id: string; name: string }) => string {
  const { t } = useTranslation("equipmentItems")
  return useCallback(
    (item: { id: string; name: string }) =>
      t(item.id, { defaultValue: item.name }),
    [t]
  )
}
