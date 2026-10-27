// Pins the tacticus-planner-data-mines commit that generated game text and images come from
// (spec: datamine-source). Only generated output is committed; the raw files live in a gitignored cache.
//   pnpm datamine:pull <tag|sha>      pin a data-mines release tag (or a full commit SHA) in datamine/REF
//                                     and fetch the files datamine/files.txt lists into the cache
//   pnpm datamine:pull --local [dir]  copy the listed files from a data-mines checkout (default: the
//                                     sibling workspace checkout); REF = "local" (rejected by CI)
//   pnpm datamine:sync                fill the cache for the committed REF; generators call ensureDatamine()
// Remote mode uses `git` with the caller's own credentials: the data-mines repo is private.
import { execFileSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const web = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const repo =
  "https://github.com/TacticusPlanner/tacticus-planner-data-mines.git"
const refPath = resolve(web, "datamine/REF")
const listPath = resolve(web, "datamine/files.txt")
const cache = resolve(web, "node_modules/.cache/datamine")
const stampPath = resolve(cache, ".pinned")

/** Repo-relative paths from files.txt; an entry ending in `/` is a whole folder. */
function listedPaths() {
  return readFileSync(listPath, "utf8")
    .split("\n")
    .map((line) => line.replace(/#.*/, "").trim())
    .filter(Boolean)
}

/** The pin as committed: `<tag> <sha>`, `<sha>`, or `local`. */
function readRef() {
  return readFileSync(refPath, "utf8").trim()
}

/** What the cache must match: the pin plus the allowlist it was filled for. */
function stamp(ref) {
  return `${ref}\n${listedPaths().join("\n")}\n`
}

function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  })
}

/** A full SHA as given; a tag resolved to the commit it points at (annotated tags peeled). */
function resolvePin(target) {
  if (/^[0-9a-f]{40}$/.test(target)) return target
  const lines = git([
    "ls-remote",
    repo,
    `refs/tags/${target}`,
    `refs/tags/${target}^{}`,
  ])
    .trim()
    .split("\n")
    .filter(Boolean)
  if (lines.length === 0) throw new Error(`No tag '${target}' in ${repo}.`)
  const peeled = lines.find((line) => line.endsWith("^{}")) ?? lines[0]
  return `${target} ${peeled.split(/\s+/)[0]}`
}

function fetchRemote(ref) {
  const sha = ref.split(/\s+/).at(-1)
  rmSync(cache, { recursive: true, force: true })
  mkdirSync(cache, { recursive: true })
  git(["init", "-q"], cache)
  git(["remote", "add", "origin", repo], cache)
  git(
    [
      "sparse-checkout",
      "set",
      "--no-cone",
      ...listedPaths().map((p) => `/${p}`),
    ],
    cache
  )
  git(
    ["fetch", "-q", "--depth", "1", "--filter=blob:none", "origin", sha],
    cache
  )
  git(["checkout", "-q", "FETCH_HEAD"], cache)
}

function copyLocal(source) {
  rmSync(cache, { recursive: true, force: true })
  for (const path of listedPaths()) {
    const from = resolve(source, path)
    if (!existsSync(from)) throw new Error(`${path} is not in ${source}.`)
    cpSync(from, resolve(cache, path), { recursive: true })
  }
}

/**
 * The cache folder, holding the listed files at the committed pin. Re-fetches when the pin or the
 * allowlist changed since the last fill. A `local` pin is used as last copied.
 */
export function ensureDatamine() {
  const ref = readRef()
  if (existsSync(stampPath) && readFileSync(stampPath, "utf8") === stamp(ref))
    return cache
  if (ref === "local")
    throw new Error(
      "datamine/REF is 'local' but the cache is stale. Run 'pnpm datamine:pull --local'."
    )
  fetchRemote(ref)
  writeFileSync(stampPath, stamp(ref))
  return cache
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [mode, target, dir] = process.argv.slice(2)
  if (mode === "pull" && target === "--local") {
    copyLocal(
      resolve(dir ?? resolve(web, "../../../tacticus-planner-data-mines"))
    )
    writeFileSync(refPath, "local\n")
    writeFileSync(stampPath, stamp("local"))
  } else if (mode === "pull" && target) {
    writeFileSync(refPath, `${resolvePin(target)}\n`)
    ensureDatamine()
  } else if (mode === "sync") {
    ensureDatamine()
  } else {
    throw new Error(
      "Usage: pnpm datamine:pull <tag|sha> | --local [dir]; pnpm datamine:sync"
    )
  }
  console.log(`datamine ${readRef()} -> ${cache}`)
}
