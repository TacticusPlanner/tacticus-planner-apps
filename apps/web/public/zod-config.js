// Turns off Zod's JIT before any schema is built. Zod reads its global config from
// globalThis.__zod_globalConfig when its module loads, and with `jitless` it neither probes
// `new Function("")` nor compiles object parsers with it, so the Content-Security-Policy needs no
// 'unsafe-eval'. Loaded as a classic, render-blocking script from index.html, ahead of the bundle:
// a module imported from main.tsx would run after the shared chunks that already build schemas.
globalThis.__zod_globalConfig = Object.assign(
  globalThis.__zod_globalConfig || {},
  { jitless: true }
)
