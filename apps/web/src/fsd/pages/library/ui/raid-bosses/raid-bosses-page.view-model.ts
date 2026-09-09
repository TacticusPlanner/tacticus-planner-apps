import type {
  ModifierContext,
  RaidBoss,
  RaidBossListItem,
} from "@/entities/raid-boss"

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
  /** Resolved field-enemy names for the selected unit's encounter at the viewed step. */
  fieldEnemyNames: string[]
}
