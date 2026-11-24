import { useTranslation } from "react-i18next"

/** An ability's display name, falling back to its id. */
export function useAbilityName() {
  const { t } = useTranslation("abilities")
  return (abilityId: string) => t(abilityId, { defaultValue: abilityId })
}
