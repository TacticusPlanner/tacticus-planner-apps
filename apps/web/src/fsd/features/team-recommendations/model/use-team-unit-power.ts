import { useUnitPowerContext, type UnitPowerContext } from "@/shared/unit-power"

/** The power context the strength ordering reads: `loading` until it is read, then the context, or
 *  null when the `unit-power` dataset is absent or failed to load (every character then counts as
 *  power 0, so the page still renders). */
export function useTeamUnitPower(): {
  loading: boolean
  unitPower: UnitPowerContext | null
} {
  const read = useUnitPowerContext()
  return {
    loading: read.status === "loading",
    unitPower: read.status === "ready" ? read.data : null,
  }
}
