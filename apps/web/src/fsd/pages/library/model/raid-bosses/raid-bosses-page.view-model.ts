import type {
  ModifierContext,
  RaidBoss,
  RaidBossListItem,
} from "@/entities/raid-boss"

import type { RaidBossAdjustedProps } from "../../ui/raid-bosses/raid-boss-adjusted-stats"

/** Props of a boss or prime's page (the Bosses and primes tab with an entity in the path). */
export type RaidBossesPageViewProps = {
  bosses: RaidBossListItem[]
  primes: RaidBossListItem[]
  selectedUnit: RaidBoss
  selectedName: string
  /** The page for a boss or prime, keeping the season and comp. */
  entityPath: (unitSetId: string) => string
  /** The season reference, on the season the page was opened from. */
  seasonReferencePath: string
  stepIndex: number
  onStepChange: (index: number) => void
  modifierContext: ModifierContext
  /** Resolved field enemies (name + optional portrait) for the selected unit's encounter at the step. */
  fieldEnemies: { name: string; iconSrc?: string }[]
  /** Boss-only adjusted-stats model + HP-lost controls; `null` for a prime or no encounter. */
  adjusted: RaidBossAdjustedProps | null
}
