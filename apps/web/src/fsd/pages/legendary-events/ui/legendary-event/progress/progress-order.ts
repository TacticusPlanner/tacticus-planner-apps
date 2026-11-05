import type { BattleProgressView } from "@/entities/legendary-event"

/** A lane's battles as the progress grid lists them: the ones still open in battle order, then the
 *  fully cleared ones (struck through below a divider), also in battle order. */
export function splitClearedBattles<
  T extends Pick<BattleProgressView, "complete">,
>(battles: readonly T[]): { open: T[]; cleared: T[] } {
  return {
    open: battles.filter((battle) => !battle.complete),
    cleared: battles.filter((battle) => battle.complete),
  }
}
