#!/usr/bin/env node
// Startup-JS budget for the built web app (openspec change trim-startup-bundle). Run after
// `vite build`: `node apps/web/scripts/bundle-budget.mjs` (or `pnpm --filter web bundle:budget`).
//
// - shared: the index.html entry plus its static imports (what every route downloads first).
// - per route: shared plus the static graph of that route's lazily-loaded page modules.
// - preloads: <link rel="modulepreload"> tags in dist/index.html.
// - packages that must stay out of the shared graph (read from dist/.vite/chunk-packages.json,
//   written by the chunk-packages plugin in vite.config.ts).
// Exits 1 when any figure is over budget. Budgets are minified bytes = measured + 5%.
//
// Composition report: rollup-plugin-visualizer is not used (see tasks.md notes). For a per-module
// breakdown run `pnpm --filter web exec vite build --sourcemap` and then
// `npx source-map-explorer apps/web/dist/assets/<chunk>.js`.
import { readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const dist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist"
)

// Baseline before trim-startup-bundle: 2430 KB shared, 95 modulepreload links.
const BUNDLE_BUDGET_KB = Number(process.env.BUNDLE_BUDGET_KB ?? 1300)
const MAX_PRELOADS = 20
// Route -> manifest keys of the page modules React Router loads for it (beyond the entry).
const ROUTES = {
  "/": { budgetKb: 1300, modules: [] },
  "/home": { budgetKb: 2000, modules: ["src/fsd/pages/home/index.ts"] },
  "/library/characters": {
    budgetKb: 1310,
    modules: [
      "src/fsd/pages/library/ui/library-page.tsx",
      "src/fsd/pages/library/ui/characters/characters-list-page.tsx",
    ],
  },
}
const FORBIDDEN_IN_SHARED = [
  "posthog-js",
  "react-joyride",
  "zod",
  "@dnd-kit/core",
  "cmdk",
]

const manifest = JSON.parse(
  readFileSync(path.join(dist, ".vite/manifest.json"), "utf8")
)
const chunkPackages = JSON.parse(
  readFileSync(path.join(dist, ".vite/chunk-packages.json"), "utf8")
)

function staticGraph(keys) {
  const seen = new Set()
  const visit = (key) => {
    if (seen.has(key)) return
    const entry = manifest[key]
    if (!entry) throw new Error(`bundle-budget: no manifest entry "${key}"`)
    seen.add(key)
    for (const dep of entry.imports ?? []) visit(dep)
  }
  keys.forEach(visit)
  return seen
}

const bytesOf = (keys) =>
  [...keys].reduce(
    (sum, key) => sum + statSync(path.join(dist, manifest[key].file)).size,
    0
  )
const kb = (bytes) => Math.round(bytes / 1024)

const failures = []
const shared = staticGraph(["index.html"])
const sharedKb = kb(bytesOf(shared))
console.log(`shared startup graph: ${sharedKb} KB in ${shared.size} chunks`)
if (sharedKb > BUNDLE_BUDGET_KB)
  failures.push(`shared graph ${sharedKb} KB > ${BUNDLE_BUDGET_KB} KB`)

for (const [route, { budgetKb, modules }] of Object.entries(ROUTES)) {
  const routeKb = kb(bytesOf(staticGraph(["index.html", ...modules])))
  console.log(`${route}: ${routeKb} KB (budget ${budgetKb} KB)`)
  if (routeKb > budgetKb)
    failures.push(`${route} ${routeKb} KB > ${budgetKb} KB`)
}

const preloads = (
  readFileSync(path.join(dist, "index.html"), "utf8").match(
    /rel="modulepreload"/g
  ) ?? []
).length
console.log(`modulepreload links: ${preloads} (max ${MAX_PRELOADS})`)
if (preloads > MAX_PRELOADS)
  failures.push(`${preloads} modulepreload links > ${MAX_PRELOADS}`)

const sharedPackages = new Set(
  [...shared].flatMap((key) => chunkPackages[manifest[key].file] ?? [])
)
for (const name of FORBIDDEN_IN_SHARED) {
  if (sharedPackages.has(name))
    failures.push(`${name} is in the shared startup graph`)
}

if (failures.length > 0) {
  console.error(`\nBundle budget exceeded:\n- ${failures.join("\n- ")}`)
  process.exit(1)
}
console.log("Bundle budget OK")
