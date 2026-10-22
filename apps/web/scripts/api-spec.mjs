// Keeps the client's API types bound to one API commit (spec: api-contract-sync).
//   pnpm api:pull <sha|branch>  download that tacticus-planner-api commit's OpenAPI document; a branch is
//                               resolved to its head SHA, which is what openapi/api.ref records
//   pnpm api:pull --local       copy the document from the sibling workspace checkout; api.ref = "local"
//                               (fine while pairing with an API branch, rejected by CI)
//   pnpm api:types              regenerate src/fsd/shared/api/schema.d.ts from the committed copy (offline)
import { execFileSync } from "node:child_process"
import { copyFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import openapiTS, { astToString, COMMENT_HEADER } from "openapi-typescript"
import { format, resolveConfig } from "prettier"

const web = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const repo = "https://github.com/TacticusPlanner/tacticus-planner-api"
const specPath = "artifacts/openapi/TacticusPlanner.Api.json"
const copy = resolve(web, "openapi/api.json")
const ref = resolve(web, "openapi/api.ref")
const schema = resolve(web, "src/fsd/shared/api/schema.d.ts")

/** A full SHA as given, else the head of the named branch. */
function resolveSha(target) {
  if (/^[0-9a-f]{40}$/.test(target)) return target
  const line = execFileSync(
    "git",
    ["ls-remote", repo, `refs/heads/${target}`],
    { encoding: "utf8" }
  ).trim()
  if (!line) throw new Error(`No branch '${target}' in ${repo}.`)
  return line.split(/\s+/)[0]
}

const [mode, target] = process.argv.slice(2)
if (mode === "pull") {
  if (!target) throw new Error("Usage: pnpm api:pull <sha|branch> | --local")
  if (target === "--local") {
    copyFileSync(resolve(web, "../../../tacticus-planner-api", specPath), copy)
    writeFileSync(ref, "local\n")
  } else {
    const sha = resolveSha(target)
    const response = await fetch(
      `https://raw.githubusercontent.com/TacticusPlanner/tacticus-planner-api/${sha}/${specPath}`
    )
    if (!response.ok)
      throw new Error(`${response.status} fetching the spec at ${sha}.`)
    writeFileSync(copy, await response.text())
    writeFileSync(ref, `${sha}\n`)
  }
}

// defaultNonNullable off: a `default` in a request schema means "may be omitted", not "always present".
const types =
  COMMENT_HEADER +
  astToString(
    await openapiTS(pathToFileURL(copy), { defaultNonNullable: false })
  )
writeFileSync(
  schema,
  await format(types, { ...(await resolveConfig(schema)), filepath: schema })
)
