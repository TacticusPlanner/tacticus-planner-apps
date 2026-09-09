import type {
  ModifierContext,
  RaidBoss,
  RaidBossListItem,
} from "@/entities/raid-boss"

import type { RaidBossAdjustedProps } from "./raid-boss-adjusted-stats"

/** Flat props both sub-pages receive — computed data + callbacks, no `isMobile`. */
export type RaidBossesPageViewProps = {
  bosses: RaidBossListItem[]
  primes: RaidBossListItem[]
  selectedId: string | undefined
  selectedUnit: RaidBoss | undefined
  selectedName: string
  onSelect: (unitSetId: string) => void
  stepIndex: number
  onStepChange: (index: number) => void
  modifierContext: ModifierContext
  /** Resolved field enemies (name + optional portrait) for the selected unit's encounter at the step. */
  fieldEnemies: { name: string; iconSrc?: string }[]
  /** Boss-only adjusted-stats model + HP-lost controls; `null` for a prime or no encounter. */
  adjusted: RaidBossAdjustedProps | null
}
