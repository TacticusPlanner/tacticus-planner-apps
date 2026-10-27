// Copies the game images datamine/sprites.txt lists from the pinned data-mines `sprites-webp/` into
// public/game_catalog/datamines/, byte for byte and at the same relative path (spec: datamine-source).
// Anything else in that folder is deleted, so it always mirrors the list exactly.
//   pnpm datamine:sprites
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs"
import { dirname, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { ensureDatamine } from "./datamine.mjs"

const web = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const listPath = resolve(web, "datamine/sprites.txt")
const target = resolve(web, "public/game_catalog/datamines")

const sprites = readFileSync(listPath, "utf8")
  .split("\n")
  .map((line) => line.replace(/#.*/, "").trim())
  .filter(Boolean)

const source = resolve(ensureDatamine(), "sprites-webp")
const missing = sprites.filter((path) => !existsSync(resolve(source, path)))
if (missing.length > 0) {
  throw new Error(
    `Not in the datamine cache (is the folder in datamine/files.txt?):\n${missing.join("\n")}`
  )
}

const listed = new Set(sprites)
if (existsSync(target)) {
  for (const entry of readdirSync(target, {
    recursive: true,
    withFileTypes: true,
  })) {
    const path = relative(target, resolve(entry.parentPath, entry.name))
    if (entry.isFile() && !listed.has(path)) rmSync(resolve(target, path))
  }
}
for (const path of sprites) {
  mkdirSync(dirname(resolve(target, path)), { recursive: true })
  copyFileSync(resolve(source, path), resolve(target, path))
}
console.log(`${sprites.length} sprites -> ${relative(web, target)}`)
