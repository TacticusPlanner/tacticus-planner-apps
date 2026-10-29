/*
 * Opens every character and Machine of War page in the Library and fails with the list of units
 * whose page does not render (route error page, or an uncaught error while rendering). Catches
 * game-data surprises such as malformed ability markup that only one unit carries.
 *
 * Library routes are public, so this runs signed out and needs no captured auth state.
 * With the stack running:
 *   VITE_APP_URL=<app-url> pnpm --filter web exec playwright test library-units
 */
import { expect, test, type Page } from "@playwright/test"

test.use({ storageState: { cookies: [], origins: [] } })

const sections = [
  {
    name: "characters",
    listPath: "/library/characters",
    tile: "character-tile-",
  },
  {
    name: "machines of war",
    listPath: "/library/machines-of-war",
    tile: "mow-tile-",
  },
]

async function unitPaths(page: Page, listPath: string, tilePrefix: string) {
  await page.goto(listPath)
  const tiles = page.locator(`[data-testid^="${tilePrefix}"]`)
  // The catalog downloads on a cold start before the list renders.
  await expect(tiles.first()).toBeVisible({ timeout: 120_000 })
  return tiles.evaluateAll((links) =>
    links.map((link) => new URL((link as HTMLAnchorElement).href).pathname)
  )
}

// Client-side navigation: the router listens to popstate, so the page changes without a reload and
// the catalog loads once for the whole run.
function navigateInApp(page: Page, path: string) {
  return page.evaluate((target) => {
    window.history.pushState(null, "", target)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }, path)
}

for (const section of sections) {
  test(`every ${section.name} page opens`, async ({ page }) => {
    test.setTimeout(10 * 60_000)
    const paths = await unitPaths(page, section.listPath, section.tile)
    expect(paths.length).toBeGreaterThan(0)

    // A render error is caught by the route error boundary, which logs it rather than throwing, so
    // the logged message is the failure's reason.
    let errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text())
    })

    const rendered = page.locator('[data-testid^="unit-ability-"]').first()
    const errorPage = page.getByTestId("app-error-page")
    const unitName = page.getByTestId("unit-header").locator("h1")
    // Rules text arrives after the first paint and is parsed only then, so a page is not done until
    // no ability or trait text is still loading.
    const textLoading = page.locator('[data-testid$="-text-loading"]')
    const textFailed = page.locator('[data-testid$="-text-failed"]')

    const failures: string[] = []
    let previousName = ""
    for (const path of paths) {
      errors = []
      const fail = (problem: string) => {
        const logged =
          errors.find((error) => error.startsWith("Route rendering failed")) ??
          errors.find((error) => /Error:/.test(error)) ??
          errors[0]
        failures.push(
          `${path}: ${problem} — ${logged?.split("\n")[0] ?? "no error logged"}`
        )
        // The next unit reloads, so a stuck page or the error page cannot carry over.
        previousName = ""
      }

      if (previousName) await navigateInApp(page, path)
      else await page.goto(path)
      // Until the new unit renders, the previous unit's panels are still on screen and would pass the
      // check, so wait for the header to name a different unit (or for the error page).
      const opened = await expect(async () => {
        if (await errorPage.isVisible()) return
        expect(await unitName.textContent({ timeout: 500 })).not.toBe(
          previousName
        )
      })
        .toPass({ timeout: 15_000 })
        .then(
          () => true,
          () => false
        )
      if (!opened) {
        fail("did not open")
        continue
      }

      const settled = await expect(rendered.or(errorPage))
        .toBeVisible({ timeout: 5_000 })
        .then(() => expect(textLoading).toHaveCount(0, { timeout: 15_000 }))
        .then(
          () => true,
          () => false
        )

      if (await errorPage.isVisible()) fail("error page")
      else if (!settled) fail("abilities or their text did not load")
      else if ((await textFailed.count()) > 0) fail("rules text failed to load")
      else previousName = (await unitName.textContent()) ?? ""
    }

    console.log(
      `Opened ${paths.length} ${section.name} pages, ${failures.length} failed`
    )
    expect(failures, `${section.name} pages that failed to open`).toEqual([])
  })
}
