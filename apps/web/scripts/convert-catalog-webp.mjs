#!/usr/bin/env node
// One-time conversion of the game-catalog images to WebP (openspec change trim-startup-bundle).
// Run from apps/web: `node scripts/convert-catalog-webp.mjs [dir]` (default public/game_catalog).
// Every .png / .jpg under the folder becomes a .webp of the same name at quality 82 and its native
// size (every icon folder is already at most 256 px on its long edge; the few larger files are
// splash art and maps rendered large), and the original is deleted. Re-run it when a catalog bump
// adds PNG/JPG files; the converted output is committed.
import { readdirSync, rmSync, statSync } from "node:fs"
import path from "node:path"

import sharp from "sharp"

const root = path.resolve(process.argv[2] ?? "public/game_catalog")
const sources = readdirSync(root, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(png|jpe?g)$/i.test(entry.name))
  .map((entry) => path.join(entry.parentPath, entry.name))

let before = 0
let after = 0
for (const source of sources) {
  const target = source.replace(/\.(png|jpe?g)$/i, ".webp")
  const { size } = await sharp(source).webp({ quality: 82 }).toFile(target)
  before += statSync(source).size
  after += size
  rmSync(source)
}
console.log(
  `${sources.length} files: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`
)
