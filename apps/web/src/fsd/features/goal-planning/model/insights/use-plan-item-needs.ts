import { usePlanInsights } from "./use-plan-insights"

/**
 * Every item's have / need over all Active goals (Inventory): each upgrade material, XP, ability
 * badge, orb, forge badge and MoW component, with what is still short once the account's stock is
 * spent in priority order. Read from the one plan run Goals Insights shows (`usePlanInsights`), so the
 * two pages always agree; the run happens once per page, whatever the number of items listed.
 */
export function usePlanItemNeeds() {
  const { result, loading, isError, retry } = usePlanInsights()
  return { needs: result.itemNeeds, loading, isError, retry }
}
