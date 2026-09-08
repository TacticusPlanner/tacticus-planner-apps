import { useCallback } from "react"
import { useTranslation } from "react-i18next"

/**
 * id -> display label resolution for raid-boss game data, via dedicated id-keyed namespaces
 * (`raidBosses`, `raidBossAbilities`, `raidBossTraits`). English carries real values; other locales
 * fall back to English (the namespaces are en-only, like `traits`/`characters`). Every resolver takes
 * a `fallback` so a missing key degrades to a readable string, never a raw id.
 */
export function useRaidBossLabels() {
  const { t } = useTranslation([
    "raidBosses",
    "raidBossAbilities",
    "raidBossTraits",
  ])

  const bossName = useCallback(
    (unitSetId: string, fallback?: string) =>
      t(`raidBosses:${unitSetId}`, { defaultValue: fallback ?? unitSetId }),
    [t]
  )

  const abilityName = useCallback(
    (abilityId: string, fallback?: string) =>
      t(`raidBossAbilities:${abilityId}`, {
        defaultValue: fallback ?? abilityId,
      }),
    [t]
  )

  const traitName = useCallback(
    (traitId: string, fallback?: string) =>
      t(`raidBossTraits:${traitId}`, { defaultValue: fallback ?? traitId }),
    [t]
  )

  return { bossName, abilityName, traitName }
}
