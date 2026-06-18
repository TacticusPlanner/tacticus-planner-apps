#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import path from "node:path"

const formatExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".md",
  ".yml",
  ".yaml",
])

const lintExtensions = new Set([".ts", ".tsx"])

const stagedFiles = getStagedFiles()
const prettierFiles = stagedFiles.filter((file) =>
  formatExtensions.has(path.extname(file))
)
const lintFiles = stagedFiles.filter(
  (file) =>
    lintExtensions.has(path.extname(file)) &&
    (file.startsWith("apps/web/") || file.startsWith("packages/ui/"))
)

if (prettierFiles.length > 0) {
  run("prettier", [
    "exec",
    "prettier",
    "--write",
    "--ignore-unknown",
    ...prettierFiles,
  ])
}

runPackageLint("apps/web", lintFiles)
runPackageLint("packages/ui", lintFiles)

function getStagedFiles() {
  const result = spawnSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
    {
      encoding: "utf8",
    }
  )

  if (result.status !== 0) {
    process.stderr.write(result.stderr)
    process.exit(result.status ?? 1)
  }

  return result.stdout
    .split("\0")
    .filter(Boolean)
    .map((file) => file.replaceAll("\\", "/"))
}

function runPackageLint(packageRoot, files) {
  const packageFiles = files
    .filter((file) => file.startsWith(`${packageRoot}/`))
    .map((file) => file.slice(packageRoot.length + 1))

  if (packageFiles.length === 0) {
    return
  }

  run(`eslint in ${packageRoot}`, [
    "--dir",
    packageRoot,
    "exec",
    "eslint",
    "--fix",
    ...packageFiles,
  ])
}

function run(label, args) {
  const result =
    process.platform === "win32"
      ? spawnSync(toWindowsCommand(["pnpm", ...args]), {
          shell: true,
          stdio: "inherit",
        })
      : spawnSync("pnpm", args, {
          stdio: "inherit",
        })

  if (result.error) {
    console.error(`${label} failed: ${result.error.message}`)
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function toWindowsCommand(args) {
  return args.map(quoteWindowsArg).join(" ")
}

function quoteWindowsArg(arg) {
  if (/^[A-Za-z0-9_./:@=+-]+$/.test(arg)) {
    return arg
  }

  return `"${arg
    .replaceAll("%", "%%")
    .replaceAll("^", "^^")
    .replaceAll('"', '\\"')
    .replace(/[&|<>()]/g, "^$&")}"`
}
