#!/usr/bin/env node
// Per-rule, per-layer ESLint counts for the warning burn-down, so each PR can quote real
// before/after numbers: `pnpm --filter web lint:counts [rule-substring ...] [-- path ...]`.
//
// - With rule substrings, only matching rules are listed (e.g. `purity sort`).
// - Paths after `--` narrow the files linted (default: src).
// - Layers are the FSD folders (app, pages, widgets, features, entities, shared), `test` for
//   src/test, and `other`; test files are counted under their layer with a `(tests)` suffix.
// Runs uncached, in-process, so it sees type-aware hits that the cached `lint` can miss. A full
// run needs more than Node's default heap: the package script raises it.
import path from "node:path"
import { fileURLToPath } from "node:url"
import { ESLint } from "eslint"

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
const split = args.indexOf("--")
const filters = split === -1 ? args : args.slice(0, split)
const targets = split === -1 ? ["src"] : args.slice(split + 1)

const layerOf = (file) => {
  const relative = path.relative(webRoot, file).replaceAll("\\", "/")
  const fsd = /^src\/fsd\/([^/]+)\//.exec(relative)
  const layer =
    fsd?.[1] ?? (relative.startsWith("src/test/") ? "test" : "other")
  return /\.test\.tsx?$/.test(relative) ? `${layer} (tests)` : layer
}

const eslint = new ESLint({ cwd: webRoot })
const results = await eslint.lintFiles(targets)

/** @type {Map<string, Map<string, number>>} rule -> layer -> count */
const counts = new Map()
for (const result of results) {
  for (const message of result.messages) {
    const rule = message.ruleId ?? "(parse error)"
    if (filters.length > 0 && !filters.some((f) => rule.includes(f))) continue
    const layers = counts.get(rule) ?? new Map()
    const layer = layerOf(result.filePath)
    layers.set(layer, (layers.get(layer) ?? 0) + 1)
    counts.set(rule, layers)
  }
}

const total = (layers) => [...layers.values()].reduce((sum, n) => sum + n, 0)
const rows = [...counts.entries()].toSorted((a, b) => total(b[1]) - total(a[1]))
let grandTotal = 0
for (const [rule, layers] of rows) {
  grandTotal += total(layers)
  const detail = [...layers.entries()]
    .toSorted((a, b) => b[1] - a[1])
    .map(([layer, n]) => `${layer} ${n}`)
    .join(", ")
  console.log(`${String(total(layers)).padStart(6)}  ${rule}  (${detail})`)
}
console.log(`${String(grandTotal).padStart(6)}  total`)
