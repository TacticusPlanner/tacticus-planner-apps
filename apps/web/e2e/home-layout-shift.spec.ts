/*
 * Measures Home's layout shift (CLS) on a phone-sized viewport and fails above the Core Web
 * Vitals "good" threshold. Home is where every launch of the installed app lands, and its widgets
 * row was the largest shift in production web vitals (docs: analytics/reports/
 * 2026-11-11-web-vitals-audit.md).
 *
 * Runs against a signed-in stack, like request-count.spec.ts:
 *   playwright-cli open <app-url>          # sign in in the opened browser
 *   playwright-cli state-save apps/web/e2e/.auth/user.json
 *   VITE_APP_URL=<app-url> pnpm --filter web exec playwright test home-layout-shift
 */
import { expect, test } from "@playwright/test"

/** Google's "good" CLS threshold. */
const CLS_BUDGET = 0.1
/** How long to keep recording after load: Home's cards fill in from local and API reads. */
const SETTLE_MS = 4000

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
})

test("Home stays within the CLS budget on a phone", async ({ page }) => {
  // Record every layout shift from the start of the load, the way web-vitals does (shifts right
  // after an input don't count).
  await page.addInitScript(() => {
    const shifts: { value: number; sources: string[] }[] = []
    Object.assign(window, { __layoutShifts: shifts })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        value: number
        hadRecentInput: boolean
        sources?: { node?: Node | null }[]
      })[]) {
        if (entry.hadRecentInput) continue
        shifts.push({
          value: entry.value,
          sources: (entry.sources ?? []).map((source) => {
            const node = source.node
            if (!(node instanceof Element)) return "?"
            return node.id ? `#${node.id}` : node.tagName.toLowerCase()
          }),
        })
      }
    }).observe({ type: "layout-shift", buffered: true })
  })

  await page.goto("/home")
  await page.getByTestId("home-page").waitFor()
  await page.waitForTimeout(SETTLE_MS)

  const shifts = await page.evaluate(
    () =>
      (
        window as unknown as {
          __layoutShifts: { value: number; sources: string[] }[]
        }
      ).__layoutShifts
  )
  // Home loads in well under the 5 s session window, so the sum is its CLS.
  const cls = shifts.reduce((sum, shift) => sum + shift.value, 0)
  console.log(
    `Home CLS ${cls.toFixed(3)} from ${shifts.length} shifts:`,
    JSON.stringify(shifts)
  )
  expect(cls).toBeLessThanOrEqual(CLS_BUDGET)
})
