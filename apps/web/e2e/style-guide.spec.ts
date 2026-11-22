/*
 * ui-style-guide guard rails on every page in the app's navigation:
 * - Rule 1: the page has one `<h1>`, the shell's title (`#page-heading`). On desktop it sits in
 *   `PageHeader`; on a phone, in the mobile header.
 * - Rule 5: on a phone (coarse pointer), each button, link, tab and toggle in the page gives a hit
 *   area of at least 44px each way, counting a `::before`/`::after` hit-area extension. Text inputs
 *   and select triggers are at least 40px tall. A link inside running text is exempt.
 *
 * The lint rules in eslint.config.js catch an `<h1>` in a page at build time; this catches what
 * lint can't see: a route that renders no header, or a control that is too small once styled.
 *
 * Runs against a signed-in stack, like home-layout-shift.spec.ts:
 *   playwright-cli open <app-url>          # sign in in the opened browser
 *   playwright-cli state-save apps/web/e2e/.auth/user.json
 *   VITE_APP_URL=<app-url> pnpm --filter web exec playwright test style-guide
 */
import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

/** The navigation's pages (app/layout/nav-items.ts), plus a Library unit page for a detail view. */
const ROUTES = [
  "/home",
  "/my-game/collection",
  "/my-game/onslaught",
  "/my-game/campaigns",
  "/my-game/campaign-events",
  "/my-game/incursions",
  "/plan/goals",
  "/plan/projects",
  "/plan/insights",
  "/plan/schedule",
  "/plan/event-shop",
  "/dailies/raids",
  "/dailies/hse",
  "/dailies/hre",
  "/dailies/quest",
  "/dailies/guild-raids",
  "/legendary-events",
  "/legendary-events/master-table",
  "/legendary-events/tier-list",
  "/guild/members",
  "/guild/settings",
  "/library/characters",
  "/library/machines-of-war",
  "/library/npcs",
  "/library/raid-bosses",
  "/library/shops",
  "/library/characters/ultraTigurius",
]

/** Rule 5: 48px hit areas on touch, with a little slack for borders and rounding. */
const MIN_TARGET = 44
/** Rule 5: inputs and selects are 40px on touch, with no hit-area wrapper. */
const MIN_FIELD = 40

type Heading = { id: string; inPageHeader: boolean; inMobileHeader: boolean }

function headings(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("h1")].map((heading): Heading => ({
      id: heading.id,
      inPageHeader: heading.closest('[data-slot="page-header"]') !== null,
      inMobileHeader: heading.closest('[data-testid="mobile-header"]') !== null,
    }))
  )
}

/** Controls in `<main>` whose hit area is under the rule 5 minimum, described for the report. */
function smallTargets(page: Page) {
  return page.evaluate(
    ({ minTarget, minField }) => {
      const controls =
        'button, a[href], [role="button"], [role="tab"], [role="checkbox"], [role="radio"], [role="switch"], input:not([type="hidden"]), textarea, select, [role="combobox"]'
      const fields =
        'input:not([type="checkbox"]):not([type="radio"]), textarea, select, [role="combobox"]'
      const px = (value: string) =>
        value === "auto" ? 0 : Number.parseFloat(value)

      // The element's box grown by any absolutely positioned pseudo-element, which is how
      // packages/ui widens a hit area on touch (`pointer-coarse:after:-inset-y-1`).
      const hitArea = (element: Element) => {
        const rect = element.getBoundingClientRect()
        let { left, top, right, bottom } = rect
        for (const pseudo of ["::before", "::after"]) {
          const style = getComputedStyle(element, pseudo)
          if (style.content === "none" || style.position !== "absolute")
            continue
          left = Math.min(left, rect.left + px(style.left))
          top = Math.min(top, rect.top + px(style.top))
          right = Math.max(right, rect.right - px(style.right))
          bottom = Math.max(bottom, rect.bottom - px(style.bottom))
        }
        return { width: right - left, height: bottom - top }
      }

      const describe = (element: Element) => {
        const label =
          element.getAttribute("data-testid") ??
          element.getAttribute("aria-label") ??
          element.textContent.trim().slice(0, 40)
        const role = element.getAttribute("role")
        return `${element.tagName.toLowerCase()}${role === null ? "" : `[role=${role}]`} "${label}"`
      }

      const main = document.querySelector("main") ?? document.body
      const problems: string[] = []
      for (const element of main.querySelectorAll(controls)) {
        const rect = element.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        if (element.closest('[aria-hidden="true"], [inert]')) continue
        if (getComputedStyle(element).visibility === "hidden") continue
        // A link in running text is sized by the text around it (WCAG 2.5.8's inline exception).
        if (element.matches("a") && element.closest("p")) continue

        if (element.matches(fields)) {
          // A field inside a label (a search box with its icon) is as big as the label.
          const target = element.closest("label") ?? element
          const { height } = hitArea(target)
          if (height < minField - 0.5)
            problems.push(`${describe(element)} ${Math.round(height)}px tall`)
          continue
        }
        const { width, height } = hitArea(element)
        if (width < minTarget - 0.5 || height < minTarget - 0.5)
          problems.push(
            `${describe(element)} ${Math.round(width)}×${Math.round(height)}px`
          )
      }
      return problems
    },
    { minTarget: MIN_TARGET, minField: MIN_FIELD }
  )
}

/** `page.evaluate`, once more after a full reload that lands mid-read (an app update, a redirect). */
async function evaluateSettled<T>(page: Page, read: () => Promise<T>) {
  try {
    return await read()
  } catch (error) {
    if (!String(error).includes("Execution context was destroyed")) throw error
    await page.waitForLoadState("load")
    await expect(page.locator("#page-heading")).toBeVisible({ timeout: 45_000 })
    return read()
  }
}

/** Opens a page and waits for it to fill in; false when its title never shows. */
async function openSettled(page: Page, path: string) {
  const title = page.locator("#page-heading")
  const shows = () =>
    expect(title)
      .toBeVisible({ timeout: 45_000 })
      .then(
        () => true,
        () => false
      )
  await page.goto(path)
  // A local stack can stall one load (a rate-limited sync); one reload tells that from a page
  // that never renders its header.
  let opened = await shows()
  if (!opened) {
    await page.reload()
    opened = await shows()
  }
  if (!opened) return false
  // Pages fill in from local and API reads; wait for their skeletons to go.
  await expect(
    page.locator('main [data-slot="skeleton"], main .animate-pulse')
  ).toHaveCount(0, { timeout: 30_000 })
  return true
}

test.describe("desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test("every page has one h1, in PageHeader", async ({ page }) => {
    test.setTimeout(ROUTES.length * 60_000)
    const failures: string[] = []
    for (const path of ROUTES) {
      if (!(await openSettled(page, path))) {
        failures.push(`${path}: the page title never showed`)
        continue
      }
      const found = await evaluateSettled(page, () => headings(page))
      if (
        found.length !== 1 ||
        found[0]?.id !== "page-heading" ||
        !found[0].inPageHeader
      )
        failures.push(`${path}: ${JSON.stringify(found)}`)
    }
    expect(failures, failures.join("\n")).toEqual([])
  })
})

test.describe("phone", () => {
  // An iPhone 13 sized viewport with touch, so `(pointer: coarse)` and the `pointer-coarse:` sizes
  // apply.
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })

  test("every page has one h1 in the mobile header, and touch targets meet rule 5", async ({
    page,
  }) => {
    test.setTimeout(ROUTES.length * 60_000)
    const failures: string[] = []
    for (const path of ROUTES) {
      if (!(await openSettled(page, path))) {
        failures.push(`${path}: the page title never showed`)
        continue
      }
      const found = await evaluateSettled(page, () => headings(page))
      if (
        found.length !== 1 ||
        found[0]?.id !== "page-heading" ||
        !found[0].inMobileHeader
      )
        failures.push(`${path}: h1 ${JSON.stringify(found)}`)
      for (const problem of await evaluateSettled(page, () =>
        smallTargets(page)
      ))
        failures.push(`${path}: ${problem}`)
    }
    expect(failures, failures.join("\n")).toEqual([])
  })
})
