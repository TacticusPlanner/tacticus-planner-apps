import { useCallback } from "react"
import { useTranslation } from "react-i18next"

/**
 * id -> display label resolution for raid-boss game data, via dedicated id-keyed namespaces
 * (`raidBosses`, `raidBossAbilities`, `raidBossTraits`). English carries real values; other locales
 * fall back to English (the namespaces are en-only, like `traits`/`characters`). `raidBossTraits` only
 * carries ids that resolve to a real game trait — `hasTraitName` lets a caller drop the `Boss`
 * pseudo-trait that V1 also hides.
 */
export function useRaidBossLabels() {
  const { t, i18n } = useTranslation([
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

  const hasTraitName = useCallback(
    (traitId: string) => i18n.exists(`raidBossTraits:${traitId}`),
    [i18n]
  )

  return { bossName, abilityName, traitName, hasTraitName }
}
