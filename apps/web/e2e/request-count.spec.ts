/*
 * Counts `/api/` requests per route on a cold load and on a warm in-app
 * re-navigation, and prints a Markdown table.
 *
 * MSAL sign-in cannot be scripted, so capture the signed-in state once by hand:
 *   playwright-cli open <app-url>          # sign in in the opened browser
 *   playwright-cli state-save apps/web/e2e/.auth/user.json
 * Then, with the stack running:
 *   E2E_LEGENDARY_EVENT_ID=<eventId> VITE_APP_URL=<app-url> \
 *     pnpm --filter web exec playwright test
 */
import { expect, test, type Page } from "@playwright/test"

type Count = { requests: number; bytes: number }

const eventId = process.env.E2E_LEGENDARY_EVENT_ID
const routes = [
  "/home",
  "/plan/goals",
  "/plan/projects",
  "/dailies/raids",
  `/legendary-events/${eventId ?? ""}`,
]

async function measure(page: Page, go: () => Promise<unknown>) {
  const count: Count = { requests: 0, bytes: 0 }
  const onResponse = async (response: {
    url(): string
    body(): Promise<Buffer>
  }) => {
    if (!new URL(response.url()).pathname.startsWith("/api/")) return
    count.requests += 1
    count.bytes += await response.body().then(
      (body) => body.length,
      () => 0
    )
  }
  page.on("response", onResponse)
  await go()
  await page.waitForLoadState("networkidle")
  page.off("response", onResponse)
  return count
}

// Client-side navigation: the router listens to popstate, so this changes the
// route without reloading the page (the query cache survives).
function navigateInApp(page: Page, path: string) {
  return page.evaluate((target) => {
    window.history.pushState(null, "", target)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }, path)
}

test("request counts per route", async ({ page }) => {
  expect(eventId, "set E2E_LEGENDARY_EVENT_ID").toBeTruthy()
  const rows: string[] = []
  for (const route of routes) {
    const cold = await measure(page, () => page.goto(route))
    const away = route === "/home" ? "/plan/goals" : "/home"
    await measure(page, () => navigateInApp(page, away))
    const warm = await measure(page, () => navigateInApp(page, route))
    rows.push(
      `| ${route} | ${cold.requests} | ${cold.bytes} | ${warm.requests} | ${warm.bytes} |`
    )
  }
  console.log(
    [
      "| Route | Cold requests | Cold bytes | Warm requests | Warm bytes |",
      "| --- | --- | --- | --- | --- |",
      ...rows,
    ].join("\n")
  )
})
