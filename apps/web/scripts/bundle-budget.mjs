#!/usr/bin/env node
// Startup-JS budget for the built web app (openspec change trim-startup-bundle). Run after
// `vite build`: `node apps/web/scripts/bundle-budget.mjs` (or `pnpm --filter web bundle:budget`).
//
// - shared: the index.html entry plus its static imports (what every route downloads first).
// - per route: shared plus the static graph of that route's lazily-loaded page modules.
// - preloads: <link rel="modulepreload"> tags in dist/index.html.
// - packages that must stay out of the shared graph (read from dist/.vite/chunk-packages.json,
//   written by the chunk-packages plugin in vite.config.ts).
// Budgets live in apps/web/bundle-budget.json: each figure has a baseline and fails only above
// baseline + headroomPercent, so small growth warns instead of failing the PR. `--update` writes
// the measured figures back as the new baselines (for growth you mean to keep).
//
// Composition report: rollup-plugin-visualizer is not used (see tasks.md notes). For a per-module
// breakdown run `pnpm --filter web exec vite build --sourcemap` and then
// `npx source-map-explorer apps/web/dist/assets/<chunk>.js`.
import { readFileSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const dist = path.join(webRoot, "dist")
const budgetFile = path.join(webRoot, "bundle-budget.json")
const budget = JSON.parse(readFileSync(budgetFile, "utf8"))
const update = process.argv.includes("--update")
const limitOf = (baselineKb) =>
  Math.round(baselineKb * (1 + budget.headroomPercent / 100))

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

// The production build's PostHog source-map plugin (vite.config.ts) prepends a ~0.4 KB chunk-id
// snippet and appends a `//# chunkId=` comment to every chunk. That is fixed per-chunk overhead,
// not app code, so it is left out: the budget measures the same thing with or without the upload.
const POSTHOG_CHUNK_ID =
  /!function\(\)\{try\{var e="undefined"!=typeof window[^\n]*?_posthogChunkIds\[n\]=[^\n]*?\}catch\(e\)\{\}\}\(\);|\n\/\/# chunkId=[^\n]*/g

const bytesOf = (keys) =>
  [...keys].reduce((sum, key) => {
    const file = path.join(dist, manifest[key].file)
    const injected = readFileSync(file, "utf8")
      .match(POSTHOG_CHUNK_ID)
      ?.reduce((bytes, match) => bytes + Buffer.byteLength(match), 0)
    return sum + statSync(file).size - (injected ?? 0)
  }, 0)
const kb = (bytes) => Math.round(bytes / 1024)

const failures = []
const warnings = []
const check = (label, measuredKb, baselineKb) => {
  const limitKb = limitOf(baselineKb)
  console.log(
    `${label}: ${measuredKb} KB (baseline ${baselineKb} KB, limit ${limitKb} KB)`
  )
  // --update accepts the measured size as the new baseline, so it never fails on size.
  if (update) return
  if (measuredKb > limitKb)
    failures.push(`${label} ${measuredKb} KB > limit ${limitKb} KB`)
  else if (measuredKb > baselineKb)
    warnings.push(
      `${label} grew to ${measuredKb} KB, above its ${baselineKb} KB baseline (limit ${limitKb} KB)`
    )
}

const shared = staticGraph(["index.html"])
const sharedKb = kb(bytesOf(shared))
check(
  `shared startup graph (${shared.size} chunks)`,
  sharedKb,
  budget.shared.baselineKb
)
if (update) budget.shared.baselineKb = sharedKb

for (const [route, entry] of Object.entries(budget.routes)) {
  const routeKb = kb(bytesOf(staticGraph(["index.html", ...entry.modules])))
  check(route, routeKb, entry.baselineKb)
  if (update) entry.baselineKb = routeKb
}

const preloads = (
  readFileSync(path.join(dist, "index.html"), "utf8").match(
    /rel="modulepreload"/g
  ) ?? []
).length
console.log(`modulepreload links: ${preloads} (max ${budget.maxPreloads})`)
if (preloads > budget.maxPreloads)
  failures.push(`${preloads} modulepreload links > ${budget.maxPreloads}`)

const sharedPackages = new Set(
  [...shared].flatMap((key) => chunkPackages[manifest[key].file] ?? [])
)
for (const name of budget.forbiddenInShared) {
  if (sharedPackages.has(name))
    failures.push(`${name} is in the shared startup graph`)
}

if (update) {
  writeFileSync(budgetFile, `${JSON.stringify(budget, null, 2)}\n`)
  console.log(
    `Baselines written to ${path.relative(process.cwd(), budgetFile)}`
  )
}
// GitHub Actions shows ::warning:: lines as annotations on the run and the PR.
const annotate = process.env.GITHUB_ACTIONS === "true"
for (const warning of warnings)
  console.warn(
    annotate
      ? `::warning title=Bundle budget::${warning}`
      : `warning: ${warning}`
  )
if (failures.length > 0) {
  console.error(`\nBundle budget exceeded:\n- ${failures.join("\n- ")}`)
  process.exit(1)
}
console.log("Bundle budget OK")
