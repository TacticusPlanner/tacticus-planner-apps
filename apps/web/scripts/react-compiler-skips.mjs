#!/usr/bin/env node
// Fails when React Compiler skips a function outside the allowlist below, so new code can't quietly
// fall back to uncompiled renders: `pnpm --filter web lint:compiler`. It runs the compiler's Babel
// plugin over src (and packages/ui, which web compiles from source) and reports every skip.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { transformAsync } from "@babel/core"

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

/** Files allowed to skip, each with why. Remove an entry once its file compiles. */
const allowed = new Map([
  [
    "src/fsd/entities/legendary-event/model/use-legendary-event.ts",
    '"use no memo": reads the shared minute ticker, which compiled memos would freeze',
  ],
  [
    "src/fsd/entities/legendary-event/model/use-legendary-events.ts",
    '"use no memo": reads the shared minute ticker, which compiled memos would freeze',
  ],
  [
    "src/fsd/shared/ability-text/use-rules-text.ts",
    "manual memo kept: compiling it would cache reads of i18next's mutable store",
  ],
  [
    "src/fsd/pages/legendary-events/ui/plan-wizard/use-plan-draft.ts",
    "manual memo over a dependency that is mutated later",
  ],
])

const sourceFiles = (dir) =>
  fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter((file) => !/\.test\.tsx?$|\.d\.ts$|[/\\]test[/\\]/.test(file))

const files = [
  ...sourceFiles(path.join(webRoot, "src")),
  ...sourceFiles(path.join(webRoot, "../../packages/ui/src")),
]

const skips = []
for (const file of files) {
  const relative = path.relative(webRoot, file).replaceAll("\\", "/")
  await transformAsync(fs.readFileSync(file, "utf8"), {
    filename: file,
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ["typescript", "jsx"] },
    plugins: [
      [
        "babel-plugin-react-compiler",
        {
          panicThreshold: "none",
          logger: {
            logEvent: (_filename, event) => {
              if (event.kind !== "CompileError" && event.kind !== "CompileSkip")
                return
              const reason =
                event.detail?.options?.reason ??
                event.detail?.reason ??
                event.reason ??
                "skipped"
              skips.push({
                relative,
                reason: String(reason),
                line: event.fnLoc?.start?.line,
              })
            },
          },
        },
      ],
    ],
  })
}

const unexpected = skips.filter((skip) => !allowed.has(skip.relative))
const stale = [...allowed.keys()].filter(
  (file) => !skips.some((skip) => skip.relative === file)
)
for (const skip of unexpected) {
  console.error(
    `${skip.relative}${skip.line ? `:${skip.line}` : ""}  ${skip.reason}`
  )
}
for (const file of stale) {
  console.error(`${file}  compiles now: remove it from the allowlist`)
}
console.log(
  `${files.length} files, ${skips.length} skips (${allowed.size} allowed), ${unexpected.length} unexpected`
)
if (unexpected.length > 0 || stale.length > 0) process.exit(1)
